interface TableProps {
  title: string;
  headers: string[];
  rows: JSX.Element[][]; // Array of rows, each row is an array of JSX elements
  loading: boolean;
}

const Table: React.FC<TableProps> = ({ title, headers, rows, loading }) => {
  return (
    <div className="p-4 rounded">
      <div className="text-lg font-semibold mb-2">{title}</div>

      {loading ? (
        <div className="text-center text-sm text-gray-400">Loading...</div>
      ) : (
        <div
          style={{
            maxHeight: "calc(1.25rem * 10 + 2px)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <table className="min-w-full text-sm bg-gray-800 border border-gray-600">
            <thead>
              <tr className="text-white">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-1 px-2 border-b border-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="text-white">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="py-1 px-2 border-b border-gray-600"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Table;
