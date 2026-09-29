import { $, n, out, bad, loan } from "../standard.js";
export const calculate = () => {
  let x = {
    Twin: ["38 × 75 in", "96.5 × 190.5 cm"],
    TwinXL: ["38 × 80 in", "96.5 × 203.2 cm"],
    Full: ["54 × 75 in", "137.2 × 190.5 cm"],
    Queen: ["60 × 80 in", "152.4 × 203.2 cm"],
    King: ["76 × 80 in", "193 × 203.2 cm"],
    CalKing: ["72 × 84 in", "182.9 × 213.4 cm"],
  }[$("size").value];
  out(x[0], x[1]);
};
