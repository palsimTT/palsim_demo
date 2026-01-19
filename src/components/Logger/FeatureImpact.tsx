interface FeatureImpactItem {
  id: string;
  name: string;
  impact: number;
}

interface FeatureImpactProps {
  items: FeatureImpactItem[];
}

const FeatureImpact = ({ items }: FeatureImpactProps) => {
  const maxImpact = Math.max(...items.map(item => item.impact), 0.01);

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {/* Bar Chart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, index) => {
          const barWidth = (item.impact / maxImpact) * 100;
          const isPositive = index < items.length / 2;
          
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>
              <div style={{ flex: 1, height: '16px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{ 
                    height: '100%',
                    borderRadius: '2px',
                    backgroundColor: isPositive ? '#30C72E' : '#FC4F4F',
                    width: `${barWidth}%`,
                    opacity: 0.6 + (item.impact / maxImpact) * 0.4
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '90px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#696969', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureImpact;
