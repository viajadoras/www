import {
  calculateLedger,
  type Entry,
  exampleLedger,
  type Ledger,
  ledgerCsv,
  money,
  parseMoney,
  validateLedger,
} from './trip-ledger';

export function initLedger(root: HTMLElement) {
  const get = <T extends HTMLElement>(selector: string) => {
    const found = root.querySelector<T>(selector);
    if (!found) throw new Error(`Controle ausente: ${selector}`);
    return found;
  };
  const personForm = get<HTMLFormElement>('[data-person-form]');
  const entryForm = get<HTMLFormElement>('[data-entry-form]');
  const save = get<HTMLInputElement>('[data-save]');
  const status = get('[data-status]');
  const key = 'viajadoras-trip-ledger-v1';
  let data: Ledger = { people: [], entries: [] };
  let example = false;
  let editing: string | null = null;
  let removed: { entry: Entry; index: number } | null = null;
  const field = (name: string) =>
    entryForm.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const name = (id: string) => {
    const person = data.people.find((p) => p.id === id);
    if (!person) throw new Error('Participante ausente.');
    return person.name;
  };
  const notify = (text: string) => {
    status.textContent = text;
  };
  const element = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text = '',
    className = '',
  ) => {
    const el = document.createElement(tag);
    el.textContent = text;
    el.className = className;
    return el;
  };
  const button = (text: string, action: () => void) => {
    const b = element('button', text, 'ledger-text-button');
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  };
  function persist() {
    try {
      if (save.checked && !example)
        localStorage.setItem(key, JSON.stringify(data));
      else localStorage.removeItem(key);
      get('[data-save-status]').textContent = '';
      return true;
    } catch {
      save.checked = false;
      get('[data-save-status]').textContent =
        'Não foi possível atualizar a cópia neste navegador. Baixe a planilha para guardar o registro.';
      return false;
    }
  }
  function setKind() {
    const transfer = field('kind').value === 'transfer';
    get('[data-split]').hidden = transfer;
    get('[data-recipient-label]').hidden = !transfer;
    get('[data-payer-label]').textContent = transfer
      ? 'Quem enviou?'
      : 'Quem pagou?';
    get('[data-entry-submit]').textContent = editing
      ? 'Salvar alteração'
      : transfer
        ? 'Registrar acerto'
        : 'Adicionar despesa';
  }
  function resetForm() {
    editing = null;
    entryForm.reset();
    get('[data-cancel]').hidden = true;
    setKind();
  }
  function render() {
    get('[data-example-note]').hidden = !example;
    get('[data-example]').hidden =
      example || data.entries.length > 0 || data.people.length > 0;
    save.disabled = example;
    entryForm.hidden = data.people.length < 2;
    get('[data-setup]').hidden = data.people.length >= 2;
    const people = get('[data-people]');
    people.replaceChildren();
    for (const p of data.people) {
      const li = element('li');
      li.append(element('span', p.name));
      const remove = button(`Remover ${p.name}`, () => {
        data.people = data.people.filter((x) => x.id !== p.id);
        render();
        persist();
        notify(`${p.name} removida.`);
      });
      remove.setAttribute('aria-label', `Remover ${p.name}`);
      remove.textContent = '×';
      remove.disabled = data.entries.some(
        (e) => e.payer === p.id || e.participants.includes(p.id),
      );
      if (remove.disabled)
        remove.title = 'Remova os registros desta pessoa antes de removê-la.';
      li.append(remove);
      people.append(li);
    }
    for (const target of ['payer', 'recipient']) {
      const select = field(target) as HTMLSelectElement;
      const old = select.value;
      select.replaceChildren();
      for (const p of data.people) {
        const option = element('option', p.name);
        option.value = p.id;
        select.append(option);
      }
      if (data.people.some((p) => p.id === old)) select.value = old;
    }
    const checks = get('[data-participants]');
    checks.replaceChildren();
    for (const p of data.people) {
      const label = element('label');
      const input = element('input');
      input.type = 'checkbox';
      input.name = 'participants';
      input.value = p.id;
      input.checked = true;
      label.append(input, document.createTextNode(p.name));
      checks.append(label);
    }
    const result = calculateLedger(data);
    get('[data-total]').textContent = money(result.total);
    get('[data-empty]').hidden = data.entries.length > 0;
    get('[data-summary]').hidden = data.entries.length === 0;
    get('[data-undo]').hidden = !removed;
    const records = get('[data-records]');
    records.replaceChildren();
    for (const entry of data.entries) {
      const row = element('article', '', 'ledger-record');
      const content = element('div');
      content.append(element('h4', entry.description));
      content.append(
        element(
          'p',
          entry.kind === 'expense'
            ? `${name(entry.payer)} pagou · divisão entre ${entry.participants.map(name).join(', ')}`
            : `${name(entry.payer)} enviou para ${name(entry.participants[0])}`,
          'ledger-help',
        ),
      );
      const amount = element('strong', money(entry.cents));
      const actions = element('div', '', 'ledger-actions');
      const edit = button('Editar', () => {
        editing = entry.id;
        field('kind').value = entry.kind;
        field('description').value = entry.description;
        field('amount').value = (entry.cents / 100)
          .toFixed(2)
          .replace('.', ',');
        field('payer').value = entry.payer;
        if (entry.kind === 'transfer')
          field('recipient').value = entry.participants[0];
        entryForm
          .querySelectorAll<HTMLInputElement>('[name="participants"]')
          .forEach((input) => {
            input.checked = entry.participants.includes(input.value);
          });
        get('[data-cancel]').hidden = false;
        setKind();
        field('description').focus();
        notify(`Editando ${entry.description}.`);
      });
      edit.setAttribute('aria-label', `Editar ${entry.description}`);
      const remove = button('Excluir', () => {
        removed = { entry, index: data.entries.indexOf(entry) };
        data.entries = data.entries.filter((e) => e.id !== entry.id);
        resetForm();
        render();
        persist();
        notify(`${entry.description} excluída. Você pode desfazer a exclusão.`);
      });
      remove.setAttribute('aria-label', `Excluir ${entry.description}`);
      actions.append(edit, remove);
      row.append(content, amount, actions);
      records.append(row);
    }
    const transfers = get('[data-transfers]');
    transfers.replaceChildren();
    if (!result.transfers.length)
      transfers.append(
        element('li', 'Tudo acertado. Ninguém tem saldo pendente.'),
      );
    for (const t of result.transfers) {
      const li = element('li');
      li.append(
        element('span', `${name(t.from)} → ${name(t.to)}`),
        element('strong', money(t.cents)),
      );
      transfers.append(li);
    }
    const balances = get('[data-balances]');
    balances.replaceChildren();
    for (const p of result.balances) {
      const tr = element('tr');
      const heading = element('th', p.name);
      heading.scope = 'row';
      tr.append(
        heading,
        element('td', money(p.paid)),
        element('td', money(p.share)),
        element(
          'td',
          p.balance === 0
            ? 'Acertado'
            : `${p.balance > 0 ? 'Recebe' : 'Paga'} ${money(Math.abs(p.balance))}`,
        ),
      );
      balances.append(tr);
    }
  }
  personForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (editing) {
      notify('Salve ou cancele a edição antes de adicionar uma pessoa.');
      return;
    }
    const input = personForm.elements.namedItem('person') as HTMLInputElement;
    const personName = input.value.trim().replace(/\s+/g, ' ');
    if (
      !personName ||
      data.people.some(
        (p) =>
          p.name.toLocaleLowerCase('pt-BR') ===
          personName.toLocaleLowerCase('pt-BR'),
      )
    ) {
      notify('Use um nome preenchido e diferente dos que já estão na lista.');
      input.focus();
      return;
    }
    if (data.people.length >= 20) {
      notify('Este caderno aceita até 20 pessoas.');
      return;
    }
    data.people.push({ id: crypto.randomUUID(), name: personName });
    input.value = '';
    render();
    persist();
    notify(`${personName} adicionada.`);
    input.focus();
  });
  field('kind').addEventListener('change', setKind);
  entryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const cents = parseMoney(field('amount').value);
    if (cents === null) {
      notify(
        'Informe um valor maior que zero, até R$ 1.000.000,00. Use vírgula nos centavos.',
      );
      field('amount').focus();
      return;
    }
    const kind = field('kind').value as Entry['kind'];
    const participants =
      kind === 'transfer'
        ? [field('recipient').value]
        : Array.from(
            entryForm.querySelectorAll<HTMLInputElement>(
              '[name="participants"]:checked',
            ),
          ).map((input) => input.value);
    const entry: Entry = {
      id: editing ?? crypto.randomUUID(),
      description: field('description').value.trim(),
      cents,
      payer: field('payer').value,
      participants,
      kind,
    };
    if (!participants.length) {
      notify('Selecione pelo menos uma pessoa para esta despesa.');
      return;
    }
    if (kind === 'transfer' && entry.payer === participants[0]) {
      notify('Quem enviou e quem recebeu precisam ser pessoas diferentes.');
      field('recipient').focus();
      return;
    }
    const next = {
      people: data.people,
      entries: editing
        ? data.entries.map((e) => (e.id === editing ? entry : e))
        : [...data.entries, entry],
    };
    if (!validateLedger(next)) {
      notify(
        'Confira a descrição e os participantes. O limite é de 500 registros.',
      );
      return;
    }
    const wasEditing = Boolean(editing);
    data = next;
    resetForm();
    render();
    persist();
    notify(
      wasEditing
        ? 'Registro atualizado. Os saldos foram recalculados.'
        : 'Registro adicionado. Os saldos foram atualizados.',
    );
    field('description').focus();
  });
  get('[data-cancel]').addEventListener('click', () => {
    resetForm();
    render();
    notify('Edição cancelada.');
  });
  get('[data-undo]').addEventListener('click', () => {
    if (!removed) return;
    const next = { people: data.people, entries: [...data.entries] };
    next.entries.splice(removed.index, 0, removed.entry);
    if (!validateLedger(next)) {
      notify('Não foi possível restaurar: uma participante foi removida.');
      return;
    }
    data = next;
    removed = null;
    resetForm();
    render();
    persist();
    notify('Exclusão desfeita.');
  });
  get('[data-example]').addEventListener('click', () => {
    example = true;
    data = exampleLedger();
    removed = null;
    save.checked = false;
    resetForm();
    render();
    notify('Exemplo do artigo carregado. Os valores são fictícios.');
  });
  get('[data-start]').addEventListener('click', () => {
    example = false;
    data = { people: [], entries: [] };
    removed = null;
    resetForm();
    render();
    notify('Caderno vazio, pronto para sua viagem.');
    personForm.querySelector('input')?.focus();
  });
  save.addEventListener('change', () => {
    if (!persist()) return;
    if (save.checked)
      notify(
        'Viagem salva. As próximas alterações serão lembradas neste navegador.',
      );
    else
      notify(
        'A cópia salva foi removida. A viagem continua aberta nesta página.',
      );
  });
  get('[data-download]').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([ledgerCsv(data)], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = element('a');
    a.href = url;
    a.download = example
      ? 'exemplo-despesas-viajadoras.csv'
      : 'despesas-viagem-viajadoras.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Planilha preparada para download.');
  });
  get('[data-copy-summary]').addEventListener('click', async () => {
    const result = calculateLedger(data);
    const summary = `${example ? 'Exemplo fictício — ' : ''}Despesas da viagem: ${money(result.total)}\n${result.transfers.length ? result.transfers.map((t) => `${name(t.from)} paga ${money(t.cents)} para ${name(t.to)}.`).join('\n') : 'Tudo acertado.'}\nConfiram juntas os registros antes de transferir.`;
    try {
      await navigator.clipboard.writeText(summary);
      notify('Resumo copiado.');
    } catch {
      notify(`Copie este resumo: ${summary}`);
    }
  });
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (validateLedger(parsed)) {
        data = parsed;
        save.checked = true;
        notify('Sua viagem salva neste navegador foi recuperada.');
      } else
        notify(
          'O registro salvo não pôde ser recuperado. Comece um novo caderno.',
        );
    }
  } catch {
    notify(
      'O armazenamento local não está disponível. Você ainda pode usar o caderno e baixar a planilha.',
    );
  }
  render();
}
