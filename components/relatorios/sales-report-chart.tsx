"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Dados simulados
const data = [
  {
    name: "Jan",
    bolos: 4000,
    tortas: 2400,
    doces: 1800,
  },
  {
    name: "Fev",
    bolos: 3500,
    tortas: 2210,
    doces: 2200,
  },
  {
    name: "Mar",
    bolos: 4200,
    tortas: 2800,
    doces: 2500,
  },
  {
    name: "Abr",
    bolos: 5000,
    tortas: 3100,
    doces: 2800,
  },
  {
    name: "Mai",
    bolos: 4800,
    tortas: 3000,
    doces: 2600,
  },
  {
    name: "Jun",
    bolos: 5500,
    tortas: 3500,
    doces: 3000,
  },
]

export function SalesReportChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${value}`} />
        <Legend />
        <Bar dataKey="bolos" name="Bolos" fill="#8884d8" />
        <Bar dataKey="tortas" name="Tortas" fill="#82ca9d" />
        <Bar dataKey="doces" name="Doces" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  )
}
