"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

// Dados simulados
const data = [
  { name: "Bolo de Chocolate", value: 35 },
  { name: "Bolo de Morango", value: 25 },
  { name: "Torta de Limão", value: 15 },
  { name: "Cupcakes", value: 10 },
  { name: "Bolo de Cenoura", value: 8 },
  { name: "Outros", value: 7 },
]

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f"]

export function ProductsReportChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value} vendas`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
