import tableTennisIcon from '../../assets/table_tennis.png';

const Header = () => {
  return (
    <header style={{
      height: '56px',
      backgroundColor: '#ffffff',
      boxShadow: '0px 4px 15px 0px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
        <img 
          src={tableTennisIcon} 
          alt="PaLSim Logo" 
          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>
          PaLSim Dashboard
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px',paddingLeft: '8px' }}>
          {/* Strike Technique */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FF9900' }} />
            <span style={{ fontSize: '14px', color: '#000000' }}>Strike Technique</span>
          </div>
          
          {/* Ball Placement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#0571FF' }} />
            <span style={{ fontSize: '14px', color: '#000000' }}>Ball Placement</span>
          </div>
          
          {/* ST&BP Pair */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#C011FF' }} />
            <span style={{ fontSize: '14px', color: '#000000' }}>ST&BP Pair</span>
          </div>
        </div>

        <h1 style={{ fontSize: '16px', fontWeight: 300, color: '#716f6fff', marginLeft: '1250px' }}>
          This demo page does not connect to a server. The data is stored directly on the front end.
        </h1>
      </div>
    </header>
  );
};

export default Header;
