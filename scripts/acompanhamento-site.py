"""Relatório agregado dos últimos 28 dias completos no fuso de Brasília."""
import argparse
import html
import json
import os
import shutil
import subprocess
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zoneinfo import ZoneInfo

SECRETS = Path.home() / ".secrets/viajadoras"
END = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
START = END - timedelta(days=28)


def setting(path, key):
    for line in path.read_text().splitlines():
        name, _, value = line.partition("=")
        if name.strip() == key:
            return value.strip().strip('"').strip("'")
    raise ValueError(f"Chave ausente: {key}")


def hogql(query):
    token = setting(SECRETS / "posthog.env", "POSTHOG_PERSONAL_API_KEY")
    data = json.dumps({"query": {"kind": "HogQLQuery", "query": query}}).encode()
    request = urllib.request.Request(
        "https://us.posthog.com/api/projects/654558/query/",
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
    return [dict(zip(result["columns"], row)) for row in result["results"]]


def activation():
    url = urlsplit(setting(SECRETS / "heroku/api.env", "DATABASE_URL"))
    env = dict(os.environ, PGHOST=url.hostname, PGPORT=str(url.port or 5432),
               PGUSER=unquote(url.username), PGPASSWORD=unquote(url.password),
               PGDATABASE=url.path[1:], PGSSLMODE="require",
               PGOPTIONS="-c default_transaction_read_only=on -c timezone=America/Sao_Paulo -c statement_timeout=30000")
    # Coorte com sete dias completos por cadastro. Só ações após a aprovação.
    query = f"""
      WITH cohort AS (
        SELECT id, created_at, approved_at FROM accounts
        WHERE created_at >= DATE '{START}' AND created_at < DATE '{END}' - 7
        AND account_type='traveler' AND NOT is_test AND deleted_at IS NULL
      ), observed AS (
        SELECT c.*, approved_at BETWEEN created_at AND created_at + interval '7 days' approved,
        EXISTS (
          SELECT 1 FROM travel_intents t WHERE t.account_id=c.id
          AND t.created_at BETWEEN c.approved_at AND c.created_at + interval '7 days'
          UNION ALL
          SELECT 1 FROM community_event_attendees a WHERE a.account_id=c.id AND a.rsvp='GOING'
          AND a.created_at BETWEEN c.approved_at AND c.created_at + interval '7 days'
        ) acted FROM cohort c
      )
      SELECT json_build_object('cadastros',count(*),'aprovadas_em_7d',count(*) FILTER(WHERE approved),
        'plano_ou_presenca_em_7d',count(*) FILTER(WHERE approved AND acted)) FROM observed
    """
    psql = shutil.which("psql") or "/opt/homebrew/opt/libpq/bin/psql"
    result = subprocess.run([psql, "-XAt", "-v", "ON_ERROR_STOP=1", "-c", query],
                            env=env, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def table(rows, columns):
    heading = "".join(f"<th scope=col>{label}</th>" for _, label in columns)
    body = []
    for row in rows:
        cells = "".join(f"<td>{html.escape(str(row.get(key) or '—')) if row.get(key) != 0 else '0'}</td>"
                        for key, _ in columns)
        body.append(f"<tr>{cells}</tr>")
    if not body:
        body.append(f'<tr><td colspan="{len(columns)}">Sem registros no período.</td></tr>')
    return f"<table><thead><tr>{heading}</tr></thead><tbody>{''.join(body)}</tbody></table>"


def render_report(data):
    rows = data["sessoes_por_entrada_e_referencia"]
    cohort = data["coorte_app_independente"]
    return f"""<!doctype html><html lang="pt-BR"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>Aquisição do Viajadoras</title>
    <style>body{{font:1rem/1.5 system-ui;color:#33251f;background:#fcf8f5;margin:auto;max-width:70rem;padding:2rem 1rem}}
    h1,h2{{font-family:Georgia,serif;color:#562718}}h2{{margin-top:2rem}}table{{border-collapse:collapse;width:100%;font-size:.91rem}}
    td,th{{padding:.55rem;text-align:left;border-bottom:1px solid #d8bdaa;overflow-wrap:anywhere}}th{{background:#f7f0ea}}
    @media(max-width:600px){{td,th{{padding:.25rem;font-size:.8rem}}}}</style><main>
    <h1>Aquisição do Viajadoras</h1><p>{START:%d/%m/%Y} a {END-timedelta(days=1):%d/%m/%Y} · 28 dias completos</p>
    <h2>Do site às lojas</h2><p>{sum(x['sessoes'] for x in rows)} sessões elegíveis.
    Em {sum(x['com_clique_na_loja'] for x in rows)}, houve clique para uma loja.</p>
    {table(rows, [('entrada','Entrada'),('referencia','Referência'),('campanha','Campanha'),('sessoes','Sessões'),('com_clique_na_loja','Com clique')])}
    <h2>Encontro, parcerias e verificação</h2><p>Contagem de cliques nos caminhos do site. Inscrições e propostas recebidas são conferidas com a organização.</p>
    {table(data['interacoes_site'], [('acao','Ação'),('pagina','Página'),('local','Seção'),('cliques','Cliques')])}
    <h2>Depois do cadastro no app</h2><p>Coorte independente de {cohort['cadastros']} cadastros reais com sete dias completos de observação.
    {cohort['aprovadas_em_7d']} tiveram aprovação nesse intervalo. Dessas, {cohort['plano_ou_presenca_em_7d']} criaram um plano ou registraram presença em um evento após a aprovação, até o sétimo dia.</p>
    <h2>Falhas reportadas na contagem própria de cliques</h2>
    {table(data['falhas_de_medicao_reportadas'], [('motivo','Motivo'),('falhas','Ocorrências')])}</main></html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, help="Salvar relatório privado em HTML")
    args = parser.parse_args()
    period = f"""timestamp >= toDateTime('{START} 00:00:00','America/Sao_Paulo')
      AND timestamp < toDateTime('{END} 00:00:00','America/Sao_Paulo')
      AND properties.$host IN ('viajadoras.com','www.viajadoras.com')"""
    sessions = hogql(f"""
      SELECT entrada, referencia, campanha, count() AS sessoes, countIf(loja>0) AS com_clique_na_loja
      FROM (SELECT properties.$session_id AS sessao,
        argMinIf(properties.$pathname,timestamp,event='$pageview') AS entrada,
        argMinIf(properties.$referring_domain,timestamp,event='$pageview') AS referencia,
        argMinIf(if(properties.utm_campaign IN ('brunch_goiania','piloto_parcerias'),
          properties.utm_campaign,''),timestamp,event='$pageview') AS campanha,
        countIf(event='store_click') AS loja FROM events
        WHERE {period} AND properties.$session_id IS NOT NULL
        AND event IN ('$pageview','store_click') GROUP BY sessao HAVING countIf(event='$pageview')>0)
      WHERE entrada NOT IN ('/acompanhar/','/privacidade/','/termos/','/ajuda/','/convite/')
      GROUP BY entrada, referencia, campanha ORDER BY sessoes DESC
    """)
    actions = hogql(f"""SELECT properties.acao AS acao, properties.pagina AS pagina,
      properties.local AS local, count() AS cliques FROM events
      WHERE {period} AND event='site_action' GROUP BY acao,pagina,local ORDER BY cliques DESC""")
    failures = hogql(f"""SELECT properties.motivo AS motivo,count() AS falhas FROM events
      WHERE {period} AND event='store_click_error' GROUP BY motivo ORDER BY falhas DESC""")
    data = {"inicio_inclusivo": str(START), "fim_exclusivo": str(END),
                      "sessoes_por_entrada_e_referencia": sessions, "interacoes_site": actions,
                      "falhas_de_medicao_reportadas": failures,
                      "coorte_app_independente": activation()}
    if args.html:
        args.html.write_text(render_report(data), encoding="utf-8")
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
