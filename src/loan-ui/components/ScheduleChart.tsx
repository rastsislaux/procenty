import React from 'react';
import { LoanResult } from '../../loan-engine';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function ScheduleChart({ result }: { result: LoanResult }) {
  const data = result.schedule.map((r) => ({
    month: r.monthIndex,
    installment: Number(r.installment.replace(/,/g, '')),
    principal: Number(r.principalPortion.replace(/,/g, '')),
    interest: Number(r.interestPortion.replace(/,/g, '')),
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="installment" stroke="#2563eb" dot={false} name="Installment" />
          <Line type="monotone" dataKey="principal" stroke="#16a34a" dot={false} name="Principal" />
          <Line type="monotone" dataKey="interest" stroke="#ef4444" dot={false} name="Interest" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

