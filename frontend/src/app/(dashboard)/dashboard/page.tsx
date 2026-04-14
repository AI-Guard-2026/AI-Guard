import { UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Welcome to AIGuard</h2>
      <p className="mt-2 text-gray-500">
        Your EU AI Act compliance platform
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total AI Systems</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="text-3xl font-bold mt-1 text-red-600">0</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Compliant</p>
          <p className="text-3xl font-bold mt-1 text-green-600">0</p>
        </div>
      </div>
    </div>
  )
}