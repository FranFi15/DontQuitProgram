import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios'; 
import { Menu, X, ChevronRight, CheckCircle2, AlertCircle, Instagram, Mail, Youtube, Gift} from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para el Catálogo
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtro principal (Categorías)
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  // Sub-filtro individual por categoría
  const [subFilters, setSubFilters] = useState({}); 

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [followUpFilter, setFollowUpFilter] = useState(null);

  const freePlanCategory = categories.find(cat => 
    plans.some(p => p.price === 0 && p.planTypeId === cat.id)
  );

  // 1. Efecto para el Navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Cargar Categorías y Planes
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [catsRes, plansRes] = await Promise.all([
          axios.get('/plan-types'),
          axios.get('/plans')
        ]);
        setCategories(catsRes.data);
        
        const sortedPlans = plansRes.data
          .filter(p => p.isActive)
          .sort((a, b) => a.id - b.id);
        setPlans(sortedPlans);

      } catch (error) {
        console.error("Error al cargar el catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // 3. Efecto de Aparición (Scroll Reveal)
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target); 
          }
        });
      }, { 
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
      });

      const hiddenElements = document.querySelectorAll('.reveal');
      hiddenElements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, plans, activeFilter, subFilters]);

  const filteredPlans = plans.filter(p => {
    if (!selectedCategory || !followUpFilter) return false; 
    const cat = categories.find(c => c.id === p.planTypeId);
    const matchesCategory = cat?.name === selectedCategory;
    const matchesFollowUp = followUpFilter === 'WITH' ? p.hasFollowUp : !p.hasFollowUp;
    return matchesCategory && matchesFollowUp;
  });

  // 4. Función de Scroll Suave al catálogo general
  const scrollToPlans = () => {
    const section = document.getElementById('catalogo-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  // 👈 NUEVO: Función para scrollear e ir directo a la pestaña Free
  const handleScrollToFree = () => {
    if (freePlanCategory) {
      setActiveFilter(freePlanCategory.id); // Selecciona la pestaña "Free"
    }
    scrollToPlans(); // Baja al catálogo
  };

  const handleBuyClick = (planId) => {
    navigate(`/checkout/${planId}`);
  };

  const handleSubFilterChange = (categoryId, filterValue) => {
    setSubFilters(prev => ({
      ...prev,
      [categoryId]: filterValue
    }));
  };

  return (
    <div className="landing-container">
      
      {/* --- NAVBAR --- */}
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="nav-logo">
            <Link to="/"><img src="/logob.png" alt="Logo" /></Link>
          </div>

          <div className="nav-links desktop-only">
            <button onClick={scrollToPlans} className="nav-link">Catálogo</button>
            <button onClick={() => navigate('/login')} className="nav-link login-btn">
              Entrar a la App
            </button>
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-dropdown">
            <button onClick={scrollToPlans}>Catálogo</button>
            <button onClick={() => navigate('/login')}>Entrar a la App</button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="hero-section">
        <div className="video-wrapper">
          <video autoPlay loop muted playsInline className="hero-video" poster="/assets/bg-poster.jpg">
            <source src="/assets/bg-video.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        <div className="hero-content reveal">
          <span className="hero-badge">PROGRAMACIÓN ONLINE</span>
          <h1 className="hero-title">
            PLANIFICACIÓN PARA PERSONAS REALES
          </h1>
          <p className="hero-subtitle">
            Somos más que un cuerpo. 
          </p>
          <div className="hero-actions">
            <button onClick={scrollToPlans} className="btn-primary-landing">
              Ver Programas <ChevronRight size={20} />
            </button>
            
            {/* 👈 ACTUALIZADO: Si hay planes gratis, lleva a la pestaña FREE */}
            {freePlanCategory ? (
              <button 
                onClick={handleScrollToFree} 
                className="btn-secondary-landing" 
                style={{ borderColor: '#faf3ef5a', color: '#FAF3EF' }}
              >
                <Gift size={18} /> Prueba Gratis
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-secondary-landing">
                Ya soy alumno
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- SECCIÓN FILOSOFÍA --- */}
      <section className="philosophy-section">
        <div className="philosophy-content reveal">
          <h2>Somos cuerpo, mente y alma.</h2>
          <div className="divider-line"></div>
          
          <p className="lead-text">
           Este programa esta creado para personas como vos y como yo, que buscan mejorar un 1% más cada dia. Que buscan el equilibrio entre el entrenamiento, las responsabilidades diarias, los amigos, la familia y el disfrute.
          </p>
          
          <p>
            Personas que buscan enamorarse del proceso y alcanzar sus objetivos sin perder EL FOCO, <strong style={{ fontSize: '1.2rem', fontWeight: '600', color: '#FAF3EF' }}>sentirse bien.</strong><br/><br/>
            <strong  style={{ fontSize: '1.2rem', fontWeight: '600', color: '#FAF3EF' }}>Spoiler:</strong> si vos estás bien, tu rendimiento va a ir al máximo. No siempre más es más, hacerlo bien y consciente sí lo es. Somos cuerpo, mente, alma, no te olvides.
          </p>

          <div style={{ marginTop: '50px', marginBottom: '30px' }} className="divider-line"></div>
          
          <p className="lead-text" style={{ fontSize: '1.2rem', fontWeight: '600', color: '#FAF3EF' }}>
            Soy Rocio Boxall, Creadora de Don’t Quit. Program.
          </p>
          
          <p>
            Fundadora y Head Coach del Gimnasio <strong  style={{ fontSize: '1.2rem', fontWeight: '600', color: '#FAF3EF' }}>Don’t Quit.</strong>, de Bahía Blanca. Este año cumplo 10 años como entrenadora y 8 años como fundadora.
          </p>
          
          <p>
            Fui gimnasta de alto rendimiento desde los 7 hasta los 18, en ese momento, la gimnasia, se volvio incompatible con mi carrera profesional. En medio del duelo de dejar de hacer lo que siempre amé, encontre el Cross, mi corazón se volvio a sentir como en casa y entendí que me esperaba un largo camino por recorrer en el mundo del Fitness.
          </p>

          <p style={{ marginTop: '30px', fontSize: '1.2rem', fontStyle: 'italic', color: '#FAF3EF' }}>
            Te invito a recorrer este camino juntos, ¿estás listo para cumplir tus metas?
          </p>
        </div>
      </section>

      {/* --- SECCIÓN CATÁLOGO --- */}
    <section id="catalogo-section" className="lnd-catalog-section">

        {loading ? (
          <div className="catalog-loading">Cargando...</div>
        ) : (
          <div className="lnd-funnel-container">
            
            {/* PASO 1: CATEGORÍAS */}
            <div className="lnd-step-box">
              <h3>Elige tu categoria</h3>
              <div className="lnd-category-row">
                {categories.map((cat) => (
                  <button 
                    key={cat.id} 
                    className={`lnd-cat-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                    onClick={() => { setSelectedCategory(cat.name); setFollowUpFilter(null); }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* PASO 2: SEGUIMIENTO */}
            {selectedCategory && (
              <div className="lnd-step-box reveal active">
                <h3>¿Con o Sin Seguimiento?</h3>
                <div className="lnd-toggle-group">
                  <button className={`lnd-toggle-btn ${followUpFilter === 'WITH' ? 'active' : ''}`} onClick={() => setFollowUpFilter('WITH')}>
                    Con Seguimiento
                  </button>
                  <button className={`lnd-toggle-btn ${followUpFilter === 'WITHOUT' ? 'active' : ''}`} onClick={() => setFollowUpFilter('WITHOUT')}>
                    Solo Planificación
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: PLANES */}
            {selectedCategory && followUpFilter && (
              <div className="lnd-results-grid reveal active">
                {filteredPlans.length === 0 ? (
                  <p className="lnd-no-results">No hay planes disponibles para esta combinación.</p>
                ) : (
                  filteredPlans.map(plan => (
                    <div key={plan.id} className="lnd-plan-card">
                      <h4>{plan.title}</h4>
                      <div className="lnd-price">${plan.price.toLocaleString()}</div>
                      <p>{plan.description}</p>
                      <button className="lnd-buy-btn" onClick={() => navigate(`/checkout/${plan.id}`)}>
                        Elegir Plan
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </section>
        
      {/* --- FOOTER --- */}
      <footer className="landing-footer">
        <div className="footer-content">
          
          <div className="footer-brand">
            <img src="/logob.png" alt="Don't Quit Logo" className="footer-logo" />
            <p>Planificación inteligente para personas reales. Encontrá el equilibrio y llevá tu rendimiento al máximo.</p>
          </div>
          
          <div className="footer-links">
            <h4>Navegación</h4>
            <button onClick={scrollToPlans}>Catálogo de Programas</button>
            <button onClick={() => navigate('/login')}>Entrar a la App</button>
          </div>

          <div className="footer-contact">
            <h4>Contacto y Redes</h4>
            
            <a href="mailto:dontquit.bahiablanca@gmail.com" className="contact-item">
              <Mail size={18} /> dontquitprogram@gmail.com
            </a>
            
            <a href="https://www.instagram.com/rocioboxallcoach/" target="_blank" rel="noopener noreferrer" className="contact-item">
              <Instagram size={18} /> @rocioboxallcoach
            </a>

            <a href="https://tiktok.com/@rocioboxall" target="_blank" rel="noopener noreferrer" className="contact-item">
              <img src="/tiktok.svg" alt="TikTok" className="custom-social-icon" />
              @rocioboxall
            </a>

            <a href="https://www.youtube.com/@ROCIOBOXALL" target="_blank" rel="noopener noreferrer" className="contact-item">
              <Youtube size={18} /> @ROCIOBOXALL
            </a>
            
          </div>

        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Don't Quit. Program. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;