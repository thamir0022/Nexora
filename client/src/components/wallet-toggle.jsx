import { Toggle } from "@/components/ui/toggle"
import { CiWallet } from "react-icons/ci"
import { Loader2 } from "lucide-react"

const WalletToggle = ({ walletBalance, isLoading, onWalletToggle, isWalletApplied, walletAmount }) => {
  const formatPrice = (price) => {
    return `₹${price.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Toggle
        pressed={isWalletApplied}
        onPressedChange={onWalletToggle}
        disabled={walletBalance === 0}
        className="h-8 px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
      >
        <CiWallet className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{formatPrice(walletBalance)}</span>
      </Toggle>
      {isWalletApplied && walletAmount > 0 && (
        <span className="text-xs text-green-600">-{formatPrice(walletAmount)}</span>
      )}
    </div>
  )
}

export default WalletToggle
