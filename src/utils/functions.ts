/**
 * Função que recebe uma data (em string) no formato 'yyyy-mm-dd' e formata para 'dd/mm/yyyy'
 * @param date - String
 * @returns String formatada
 */
export const formatarData = (date: string) => {
  if (date && date !== "-" && date !== "00:00:00") {
    let containsT = date.includes("T");
    let containsSpace = date.includes(" ");
    if (containsSpace) {
      const [dt, time] = date.split(" ");
      const [year, month, day] = dt.split("-");
      return `${day}/${month}/${year}`;
    } else if (!containsT) {
      const [year, month, day] = date.split("-"); // Divide a string em ano, mês e dia
      return `${day}/${month}/${year}`;
    } else {
      let aux = date.split("T");
      const [year, month, day] = aux[0].split("-");
      return `${day}/${month}/${year}`;
    }
  } else {
    return "-";
  }
};

export function formatarDataParaMesAno(dataStr: string): string {
  if (dataStr !== "" && dataStr !== "-") {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    const data = new Date(dataStr);
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${mes}/${ano}`;
  } else {
    return "-";
  }
}
