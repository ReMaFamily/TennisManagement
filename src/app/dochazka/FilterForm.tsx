export default function FilterForm({ from, to }: { from: string; to: string }) {
  return (
    <form className="card flex flex-wrap items-end gap-3" action="/dochazka" method="get">
      <div>
        <label className="label" htmlFor="from">
          Od
        </label>
        <input type="date" id="from" name="from" defaultValue={from} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="to">
          Do
        </label>
        <input type="date" id="to" name="to" defaultValue={to} className="input" />
      </div>
      <button type="submit" className="btn-primary">
        Zobrazit
      </button>
    </form>
  );
}
