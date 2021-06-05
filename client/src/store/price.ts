import axios from "axios";

export async function getPrices() {
    return (await axios.get("https://api.raydium.io/coin/price")).data;
}