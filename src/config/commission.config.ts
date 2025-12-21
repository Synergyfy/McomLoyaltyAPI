import { registerAs } from "@nestjs/config";

export default registerAs("commission", () => ({
  rate: parseFloat(process.env.COMMISSION_RATE) || 0.9,
}));
