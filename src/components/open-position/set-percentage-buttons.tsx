export default function SetPercentageButtons({
  maxAmount,
  decimals,
  onSetAmount
}: {
  maxAmount: number,
  decimals: number,
  onSetAmount: Function
}) {
  return (
    <div className="flex flex-row gap-1 items-center">
      <span className="px-2 py-1 text-sm border rounded-l cursor-pointer" onClick={() => onSetAmount(Number((maxAmount * 0.25).toFixed(decimals)))}>25%</span>
      <span className="px-2 py-1 text-sm border rounded-l cursor-pointer" onClick={() => onSetAmount(Number((maxAmount * 0.5).toFixed(decimals)))}>50%</span>
      <span className="px-2 py-1 text-sm border rounded-l cursor-pointer" onClick={() => onSetAmount(Number((maxAmount * 0.75).toFixed(decimals)))}>75%</span>
      <span className="px-2 py-1 text-sm border rounded-l cursor-pointer" onClick={() => onSetAmount(maxAmount)}>Max</span>
    </div>
  )
}