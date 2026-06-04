import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    { image: '/images/buses/0039.png' },
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/routes`);
        const uniqueCities = new Set();
        data.forEach(route => {
          route.cities?.forEach(city => {
            if (city.cityName) uniqueCities.add(city.cityName);
          });
        });
        setCities(Array.from(uniqueCities).sort());
      } catch (error) {
        console.error('Error fetching routes for cities', error);
      }
    };
    fetchRoutes();
  }, []);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setJourneyDate(today);
  };

  const handleTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setJourneyDate(tomorrowStr);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (source === destination && source !== '' && destination !== '') {
      alert("Source and Destination cannot be the same city.");
      return;
    }

    navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(journeyDate)}`);
  };

  return (
    <div style={{ padding: '30px 20px 40px 20px', textAlign: 'center' }}>

      <div
        className="hero-img"
        style={{
          maxWidth: '1200px',
          paddingBottom: '10px',
          width: '100%',
          margin: '0 auto',
          height: '350px',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
      >
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              backgroundImage: `url(${slide.image})`,
              backgroundColor: '#1e293b'
            }}
            className="hero-slide-bg"
          >
            {/* Gradient Overlay for Text Visibility */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '40px',
              textAlign: 'left',
              color: 'white'
            }}>
              <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {slide.title}
              </h2>
              <p style={{ fontSize: '18px', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}

        {/* Slider Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px'
        }}>
          {heroSlides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: currentSlide === index ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: currentSlide === index ? 'var(--primary-color, #ff4b2b)' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      </div>

      {/* Premium Search Bar */}
      <div
        className="sync-gradient-border"
        style={{
          maxWidth: '1100px',
          width: '95%',
          margin: '-60px auto 40px auto',
          position: 'relative',
          zIndex: 10,
          borderRadius: '20px',
          padding: '6px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        <form
          onSubmit={handleSearch}
          className="search-form-inner"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            alignItems: 'center',
            minHeight: '80px',
            position: 'relative'
          }}
        >
          {/* Source Container */}
          <div className="search-field" style={{ flex: '1 1 auto', minWidth: '160px', padding: '16px 24px', position: 'relative', borderRight: '1px solid #edf2f7' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>From</label>
            <select
              name="source"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: 'transparent', cursor: 'pointer', appearance: 'none', padding: 0, textAlign: 'left' }}
            >
              <option value="" disabled>Select Origin</option>
              {cities.map(city => <option key={`from-${city}`} value={city}>{city}</option>)}
            </select>

            {/* Elegant Swap Button */}
            <div
              style={{
                position: 'absolute',
                right: '-18px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Route"
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '1px solid #edf2f7',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#ff4b2b'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10h14" />
                  <path d="M11 6l-4 4 4 4" />
                  <path d="M17 14H3" />
                  <path d="M13 18l4-4-4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Destination Container */}
          <div className="search-field" style={{ flex: '1 1 auto', minWidth: '160px', padding: '16px 24px', paddingLeft: '32px', borderRight: '1px solid #edf2f7' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>To</label>
            <select
              name="destination"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: 'transparent', cursor: 'pointer', appearance: 'none', padding: 0 }}
            >
              <option value="" disabled>Select Destination</option>
              {cities.map(city => <option key={`to-${city}`} value={city}>{city}</option>)}
            </select>
          </div>

          {/* Date Container */}
          <div className="search-field" style={{ flex: '1 1 auto', minWidth: '180px', padding: '16px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>

              {/* Refined Quick Select Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <span
                  onClick={handleToday}
                  style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  TODAY
                </span>
                <span
                  onClick={handleTomorrow}
                  style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  TOMORROW
                </span>
              </div>
            </div>

            <input
              type="date"
              name="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: 'transparent', cursor: 'pointer', padding: 0 }}
              required
            />
          </div>

          {/* Submit Button Container */}
          <div className="search-submit-col" style={{ flex: '0 0 auto', padding: '12px', width: '100%', maxWidth: '200px' }}>
            <button
              type="submit"
              className="sync-gradient-bg btn-primary"
              style={{ width: '100%', padding: '16px 24px', height: '100%', fontSize: '18px', fontWeight: 'bold', borderRadius: '12px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              Search
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default LandingPage;
