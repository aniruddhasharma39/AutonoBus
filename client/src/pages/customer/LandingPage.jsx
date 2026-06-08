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

  // Showcase state
  const [buses, setBuses] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeBusPairIndex, setActiveBusPairIndex] = useState(0);
  const [selectedBusForModal, setSelectedBusForModal] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

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
            if (city.cityName) {
              const normalized = city.cityName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              uniqueCities.add(normalized);
            }
          });
        });
        setCities(Array.from(uniqueCities).sort());
      } catch (error) {
        console.error('Error fetching routes for cities', error);
      }
    };

    const fetchBuses = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/buses`);
        // Only include buses with images or just all buses
        setBuses(data);
      } catch (error) {
        console.error('Error fetching buses', error);
      }
    };

    fetchRoutes();
    fetchBuses();
  }, []);

  useEffect(() => {
    if (buses.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        if (prev === 3) {
          if (buses.length > 2) {
            setActiveBusPairIndex((prevPair) => (prevPair + 1) % buses.length);
          }
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [buses.length]);

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
    <div className="landing-page-wrapper" style={{ padding: '30px 20px 40px 20px', textAlign: 'center' }}>

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
        className="sync-gradient-border search-bar-wrapper"
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
              className="swap-button-wrapper"
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

      {/* Bus Services Showcase Section */}
      {buses.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '60px auto 40px', padding: '0 20px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Our Premium Services</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Experience luxury travel with our exclusive fleet. Each service is uniquely designed for your comfort.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[0, 1].map((offset) => {
              if (buses.length === 1 && offset === 1) return null; // Only one bus available
              const busIndex = (activeBusPairIndex + offset) % buses.length;
              const bus = buses[busIndex];
              const busImages = [
                bus.images?.front || '/images/buses/placeholder-front.png',
                bus.images?.right || '/images/buses/placeholder-right.png',
                bus.images?.left || '/images/buses/placeholder-left.png',
                bus.images?.back || '/images/buses/placeholder-back.png'
              ];
              
              return (
                <div 
                  key={bus._id + offset} 
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative',
                    overflow: 'hidden', 
                    padding: '24px', 
                    paddingTop: '70px',
                    borderRadius: '20px',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    background: `linear-gradient(135deg, #111827 0%, color-mix(in srgb, ${bus.themeColor || '#0f172a'} 50%, #000) 100%)`,
                    border: `1px solid color-mix(in srgb, ${bus.themeColor || '#334155'} 40%, transparent)`,
                    boxShadow: `0 10px 30px color-mix(in srgb, ${bus.themeColor || '#000'} 15%, transparent)`
                  }}
                  onClick={() => { setSelectedBusForModal(bus); setModalImageIndex(0); }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = `0 20px 40px color-mix(in srgb, ${bus.themeColor || '#000'} 35%, transparent)`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 10px 30px color-mix(in srgb, ${bus.themeColor || '#000'} 15%, transparent)`;
                  }}
                >
                  {/* Top Left Badge */}
                  <div style={{ position: 'absolute', top: '20px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: `color-mix(in srgb, ${bus.themeColor || '#ffffff'} 20%, rgba(255,255,255,0.05))`, border: `1px solid color-mix(in srgb, ${bus.themeColor || '#ffffff'} 40%, transparent)`, borderRadius: '20px', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    {bus.serviceImage && <img src={bus.serviceImage} alt="icon" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>{bus.name.toUpperCase()}</span>
                  </div>

                  {/* Top Right Aura Image */}
                  {bus.serviceImage && (
                    <div style={{ position: 'absolute', top: '10px', right: '16px', zIndex: 5, pointerEvents: 'none' }}>
                      <img src={bus.serviceImage} alt={bus.name} style={{ width: '90px', height: '90px', objectFit: 'contain', filter: `drop-shadow(0 0 25px ${bus.themeColor || '#fff'}) drop-shadow(0 0 10px rgba(255,255,255,0.5))` }} />
                    </div>
                  )}
                  
                  <div style={{ marginTop: '10px', marginBottom: '20px', zIndex: 2, position: 'relative', textAlign: 'left' }}>
                    <h3 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>UrbanLines</h3>
                    <p style={{ fontSize: '13px', color: 'color-mix(in srgb, white 70%, transparent)', fontWeight: '500' }}>{bus.type} • {bus.totalSeats} Seats Available</p>
                  </div>

                  <div style={{ position: 'relative', height: '220px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2 }}>
                    {busImages.map((imgSrc, imgIdx) => (
                      <img 
                        key={imgIdx}
                        src={imgSrc} 
                        alt={`${bus.name} view ${imgIdx + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: currentImageIndex === imgIdx ? 1 : 0,
                          transition: 'opacity 0.5s ease-in-out'
                        }}
                      />
                    ))}
                    <div style={{ position: 'absolute', bottom: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      {[0, 1, 2, 3].map(idx => (
                        <div 
                          key={idx} 
                          style={{ 
                            width: currentImageIndex === idx ? '16px' : '6px', 
                            height: '6px', 
                            borderRadius: '3px', 
                            backgroundColor: currentImageIndex === idx ? 'white' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.3s ease'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Screen Modal Gallery */}
      {selectedBusForModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setSelectedBusForModal(null)}
            style={{ position: 'absolute', top: '20px', right: '30px', color: 'white', background: 'transparent', border: 'none', fontSize: '40px', cursor: 'pointer' }}
          >
            &times;
          </button>
          
          <div style={{ marginBottom: '20px' }}>
            {selectedBusForModal.serviceImage ? (
              <img src={selectedBusForModal.serviceImage} alt={selectedBusForModal.name} style={{ height: '50px', objectFit: 'contain' }} />
            ) : (
              <h2 style={{ color: 'white', fontSize: '32px' }}>{selectedBusForModal.name}</h2>
            )}
          </div>

          <div style={{ position: 'relative', width: '80%', maxWidth: '900px', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex(prev => (prev === 0 ? 3 : prev - 1));
              }}
              style={{ position: 'absolute', left: '-50px', color: 'white', background: 'transparent', border: 'none', fontSize: '50px', cursor: 'pointer' }}
            >
              &#10094;
            </button>
            
            <img 
              src={[
                selectedBusForModal.images?.front || '/images/buses/placeholder-front.png',
                selectedBusForModal.images?.right || '/images/buses/placeholder-right.png',
                selectedBusForModal.images?.left || '/images/buses/placeholder-left.png',
                selectedBusForModal.images?.back || '/images/buses/placeholder-back.png'
              ][modalImageIndex]} 
              alt="Bus View"
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex(prev => (prev === 3 ? 0 : prev + 1));
              }}
              style={{ position: 'absolute', right: '-50px', color: 'white', background: 'transparent', border: 'none', fontSize: '50px', cursor: 'pointer' }}
            >
              &#10095;
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {[0, 1, 2, 3].map(idx => (
              <div 
                key={idx}
                onClick={() => setModalImageIndex(idx)}
                style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  backgroundColor: modalImageIndex === idx ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
