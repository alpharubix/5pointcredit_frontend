export const getPricingDetails = (module: string, currentAmount: number) => {
  switch (module.toUpperCase()) {
    case "BSA":
      return { base: 479, gst: 86, total: 565, period: "1 Year" };
    case "GST":
      return { base: 475, gst: 86, total: 561, period: "1 Year" };
    case "ITR":
      return { base: 445, gst: 80, total: 525, period: "2 Years" };
    case "CIBIL":
      return { base: 545, gst: 98, total: 643, period: "Latest Report" };
    default:
      return { base: currentAmount, gst: 0, total: currentAmount, period: "N/A" };
  }
};
