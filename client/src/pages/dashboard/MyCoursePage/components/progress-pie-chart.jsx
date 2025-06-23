import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const COLORS = {
  completed: "#10b981", // green-500
  remaining: "#e5e7eb", // gray-200
}

export function ProgressPieChart({ completedLessons, totalLessons, size = 80 }) {
  const completed = completedLessons
  const remaining = totalLessons - completedLessons
  const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0

  const data = [
    { name: "Completed", value: completed, color: COLORS.completed },
    { name: "Remaining", value: remaining, color: COLORS.remaining },
  ]

  return (
    <div className="relative inline-flex items-center justify-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.25}
            outerRadius={size * 0.4}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text - Only percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{percentage}%</div>
        </div>
      </div>
    </div>
  )
}
