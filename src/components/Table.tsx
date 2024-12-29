interface TableProps {
  title: string;
  headers: string[];
  rows: JSX.Element[][]; // Array of rows, each row is an array of JSX elements
  loading: boolean;
  minRows?: number; // optional minRows prop
}

const Table: React.FC<TableProps> = ({
  title,
  headers,
  rows,
  loading,
  minRows,
}) => {
  const renderRows = () => {
    let renderedRows = rows.map((row, rowIndex) => (
      <tr key={rowIndex} className="text-white">
        {row.map((cell, cellIndex) => (
          <td
            key={cellIndex}
            className="py-1 px-2 border-b border-gray-600 text-left break-words"
          >
            {cell}
          </td>
        ))}
      </tr>
    ));

    // Add empty rows if needed to meet minRows
    if (minRows !== undefined) {
      while (renderedRows.length < minRows) {
        renderedRows.push(
          <tr key={renderedRows.length} className="text-white">
            {headers.map((_, cellIndex) => (
              <td
                key={cellIndex}
                className="py-1 px-2 border-b border-gray-600 text-left"
              >
                &nbsp;
              </td>
            ))}
          </tr>,
        );
      }
    }
    return renderedRows;
  };

  return (
    <div className="p-4 rounded">
      <div className="text-lg font-semibold mb-2">{title}</div>

      {loading ? (
        <div className="text-center text-sm text-gray-400">Loading...</div>
      ) : (
        <div
          style={{
            maxHeight: "calc(1.25rem * 10 + 2px)", // Maintain vertical max height
            overflowY: "auto",
            overflowX: "auto", // Enable horizontal scrolling
          }}
        >
          <table className="min-w-full text-sm bg-gray-700 border border-gray-600">
            <thead>
              <tr className="text-white">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="py-1 px-2 border-b border-gray-600 text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Table;
