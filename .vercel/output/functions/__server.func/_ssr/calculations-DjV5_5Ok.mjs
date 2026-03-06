function calculateLoan(primaryAmount, tenureMonths = 5, paymentFrequency = "monthly", serviceChargePercent = 1, markupPercent = 25) {
  const serviceChargeAmount = primaryAmount * (serviceChargePercent / 100);
  const amountUserReceives = primaryAmount - serviceChargeAmount;
  const totalRepayment = primaryAmount * (1 + markupPercent / 100);
  let totalInstallments;
  if (paymentFrequency === "monthly") {
    totalInstallments = tenureMonths;
  } else {
    totalInstallments = tenureMonths * 4;
  }
  const installmentAmount = totalRepayment / totalInstallments;
  const profitAmount = totalRepayment - primaryAmount;
  return {
    primaryAmount,
    serviceChargePercent,
    serviceChargeAmount,
    amountUserReceives,
    markupPercent,
    totalRepayment,
    tenureMonths,
    paymentFrequency,
    installmentAmount,
    totalInstallments,
    profitAmount
  };
}
function calculateStartMonth(dateGiven) {
  return new Date(dateGiven.getFullYear(), dateGiven.getMonth() + 1, 1);
}
function generatePaymentSchedule(startDate, totalRepayment, totalInstallments, frequency) {
  const baseAmount = Math.floor(totalRepayment / totalInstallments);
  const remainder = totalRepayment - baseAmount * totalInstallments;
  const schedule = [];
  for (let i = 0; i < totalInstallments; i++) {
    const dueDate = new Date(startDate);
    if (frequency === "monthly") {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else {
      dueDate.setDate(dueDate.getDate() + i * 7);
    }
    schedule.push({
      installmentNumber: i + 1,
      dueDate,
      amountDue: i === totalInstallments - 1 ? baseAmount + remainder : baseAmount
    });
  }
  return schedule;
}
export {
  calculateStartMonth as a,
  calculateLoan as c,
  generatePaymentSchedule as g
};
