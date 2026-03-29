function Pagination({ page, totalPages, setPage }) {

  if (totalPages <= 1) return null;

  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    pages.push(i);
  }

  return (

    <div className="flex justify-center items-center gap-2 mt-6">

      <button
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        Prev
      </button>

      {pages.map((p) => (

        <button
          key={p}
          onClick={() => setPage(p)}
          className={`px-3 py-1 border rounded 
          ${p === page ? "bg-black text-white" : "bg-white"}`}
        >
          {p + 1}
        </button>

      ))}

      <button
        disabled={page + 1 >= totalPages}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        Next
      </button>

    </div>

  );

}

export default Pagination;