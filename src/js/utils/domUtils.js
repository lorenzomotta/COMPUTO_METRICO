export function createCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}
