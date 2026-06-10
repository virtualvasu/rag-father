import React from 'react';
import { BarChart3, Clock, CheckCircle2, Calendar, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown Date';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const Step3Results = ({ results }) => {
  // Define vibrant colors for the variants
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Sort results descending by timestamp to get the most recent one
  const sortedResults = [...results].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const currentRun = sortedResults.length > 0 ? sortedResults[0] : null;

  let chartData = [];
  let variantNames = [];

  if (currentRun) {
    variantNames = Object.keys(currentRun.variants);
    chartData = [
      { name: 'Faithfulness' },
      { name: 'Answer Rel.' },
      { name: 'Context Prec.' },
      { name: 'Context Rec.' }
    ];

    variantNames.forEach(vName => {
      const ragas = currentRun.variants[vName].ragas_scores || {};
      chartData[0][vName] = ragas.faithfulness ? (ragas.faithfulness * 100).toFixed(1) : 0;
      chartData[1][vName] = ragas.answer_relevancy ? (ragas.answer_relevancy * 100).toFixed(1) : 0;
      chartData[2][vName] = ragas.context_precision ? (ragas.context_precision * 100).toFixed(1) : 0;
      chartData[3][vName] = ragas.context_recall ? (ragas.context_recall * 100).toFixed(1) : 0;
    });
  }

  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2 relative z-10">
        <BarChart3 className="w-5 h-5 text-primary" />
        Current Evaluation Results
      </h2>
      
      {!currentRun ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-xl border-dashed">
          <Clock className="w-8 h-8 text-text-muted mb-4" />
          <p className="text-sm font-sans text-text-secondary text-center">No evaluation results found.<br/>Run an evaluation to see metrics here.</p>
        </div>
      ) : (
        <div className="space-y-12 relative z-10">
          <div className="bg-surface-dark border border-border rounded-xl overflow-hidden shadow-inner relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
            
            <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border bg-surface/50 gap-4">
              <div>
                <h3 className="font-sans text-lg text-primary font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  {formatDate(currentRun.timestamp)}
                </h3>
                <p className="text-xs font-mono text-text-muted mt-1 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  ID: {currentRun.filename.replace('.json', '')}
                </p>
              </div>
              <div className="bg-surface p-3 rounded-lg border border-border text-center min-w-[120px]">
                <span className="block text-[10px] font-mono text-text-muted uppercase mb-1">Questions Evaluated</span>
                <span className="text-xl font-bold font-mono text-text-primary">{currentRun.num_questions}</span>
              </div>
            </div>

            {/* Chart Section */}
            <div className="p-6 h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
                  <XAxis dataKey="name" stroke="#8B8BA0" tick={{ fill: '#8B8BA0', fontSize: 12, fontFamily: 'DM Sans' }} />
                  <YAxis stroke="#8B8BA0" tick={{ fill: '#8B8BA0', fontSize: 12, fontFamily: 'DM Sans' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#2A2A3A', color: '#F0F0F5', borderRadius: '8px', fontFamily: 'DM Sans' }}
                    itemStyle={{ color: '#F0F0F5' }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'DM Sans' }} />
                  {variantNames.map((vName, i) => (
                    <Bar key={vName} dataKey={vName} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full text-left font-mono text-sm border-collapse">
                <thead>
                  <tr className="bg-surface text-text-secondary border-b border-border">
                    <th className="py-4 px-5 font-semibold text-xs uppercase tracking-wider">Variant</th>
                    <th className="py-4 px-5 font-semibold text-xs uppercase tracking-wider">Faithfulness</th>
                    <th className="py-4 px-5 font-semibold text-xs uppercase tracking-wider">Answer Rel.</th>
                    <th className="py-4 px-5 font-semibold text-xs uppercase tracking-wider">Context Prec.</th>
                    <th className="py-4 px-5 font-semibold text-xs uppercase tracking-wider">Context Rec.</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(currentRun.variants).map(([vName, vData], vIdx) => {
                    const ragas = vData.ragas_scores || {};
                    const formatPercent = (val) => val !== undefined && val !== null ? (val * 100).toFixed(1) + '%' : '-';
                    
                    const getColorClass = (val) => {
                      if (val === undefined || val === null) return 'text-text-muted';
                      if (val >= 0.8) return 'text-emerald-400 font-bold';
                      if (val >= 0.6) return 'text-amber-400 font-medium';
                      return 'text-error font-medium';
                    };

                    return (
                      <tr key={vName} className={`border-b border-border hover:bg-surface-highest/50 transition-colors ${vIdx % 2 === 0 ? 'bg-surface/30' : 'bg-surface/10'} last:border-0`}>
                        <td className="py-4 px-5 font-bold text-primary flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[vIdx % colors.length] }}></span>
                          {vName}
                        </td>
                        <td className={`py-4 px-5 ${getColorClass(ragas.faithfulness)}`}>{formatPercent(ragas.faithfulness)}</td>
                        <td className={`py-4 px-5 ${getColorClass(ragas.answer_relevancy)}`}>{formatPercent(ragas.answer_relevancy)}</td>
                        <td className={`py-4 px-5 ${getColorClass(ragas.context_precision)}`}>{formatPercent(ragas.context_precision)}</td>
                        <td className={`py-4 px-5 ${getColorClass(ragas.context_recall)}`}>{formatPercent(ragas.context_recall)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Results;
