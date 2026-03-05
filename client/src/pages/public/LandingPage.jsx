import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios'; 
import { Menu, X, ChevronRight, CheckCircle2, AlertCircle, Instagram, Mail, Youtube} from 'lucide-react';
import './LandingPage.css';


function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para el Catálogo
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('ALL');

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
        setPlans(plansRes.data.filter(p => p.isActive));
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
  }, [loading, plans, activeFilter]);

  // 4. Función de Scroll Suave
  const scrollToPlans = () => {
    const section = document.getElementById('catalogo-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleBuyClick = (planId) => {
    navigate(`/checkout/${planId}`);
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

        {/* Agregamos la clase 'reveal' aquí */}
        <div className="hero-content reveal">
          <span className="hero-badge">PROGRAMACIÓN ONLINE</span>
          <h1 className="hero-title">
            PLANIFICACIÓN PARA ATLETAS REALES
          </h1>
          <p className="hero-subtitle">
            Mejorá un 1% cada día. 
          </p>
          <div className="hero-actions">
            <button onClick={scrollToPlans} className="btn-primary-landing">
              Ver Programas <ChevronRight size={20} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary-landing">
              Ya soy alumno
            </button>
          </div>
        </div>
      </header>

      {/* --- SECCIÓN FILOSOFÍA --- */}
      <section className="philosophy-section">
        <div className="philosophy-content reveal">
          <h2>Somos cuerpo, mente y alma.</h2>
          <div className="divider-line"></div>
          
          <p className="lead-text">
            Este programa está creado para personas como vos y como yo, que buscan cada día mejorar un 1 por ciento más, encontrando un equilibrio entre el entrenamiento, las responsabilidades laborales diarias, la familia, los amigos y el disfrute.
          </p>
          
          <p>
            Personas que buscan enamorarse del proceso y alcanzar sus objetivos sin perder el foco, sentirse bien.<br/><br/>
            <strong>Spoiler:</strong> si vos estás bien, tu rendimiento va a ir al máximo. No siempre más es más, hacerlo bien y consciente sí lo es. Somos cuerpo, mente, alma, no te olvides.
          </p>

          <div style={{ marginTop: '50px', marginBottom: '30px' }} className="divider-line"></div>
          
          <p className="lead-text" style={{ fontSize: '1.2rem', fontWeight: '600', color: '#FAF3EF' }}>
            Soy Rocio Boxall, Creadora de Don’t Quit. Program.
          </p>
          
          <p>
            Fundadora y Head Coach del Gimnasio Don’t Quit. de Bahía Blanca. Este año cumplo 10 años como entrenadora y 8 años como fundadora.
          </p>
          
          <p>
            El deporte es parte de mi vida, fui gimnasta de alto rendimiento desde los 7 años hasta los 17 y justamente en ese quiebre encontré el Cross, y entendí que era ahí donde mi corazón se sentía en casa, sabía que se venía un camino largo por recorrer en el mundo del Fitness.
          </p>

          <p style={{ marginTop: '30px', fontSize: '1.2rem', fontStyle: 'italic', color: '#FAF3EF' }}>
            Te invito a recorrer este camino juntos, ¿estás listo para cumplir tus metas?
          </p>
        </div>
      </section>

      {/* --- SECCIÓN CATÁLOGO --- */}
      <section id="catalogo-section" className="catalog-section">
        <div className="catalog-header reveal">
          <h2>Elegí tu Programa</h2>
          <p>Diferentes niveles y objetivos, con la misma metodología.</p>
        </div>

        {loading ? (
          <div className="catalog-loading">Cargando programas disponibles...</div>
        ) : (
          <>
            {/* --- FILTROS DE CATEGORÍAS --- */}
            {categories.length > 0 && (
              <div className="catalog-filters reveal">
                <button 
                  className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('ALL')}
                >
                  Todos
                </button>
                
                {categories.map(cat => {
                  // Solo mostramos el botón si esa categoría tiene planes activos
                  const hasPlans = plans.some(p => p.planTypeId === cat.id);
                  if (!hasPlans) return null;

                  return (
                    <button 
                      key={`filter-${cat.id}`}
                      className={`filter-btn ${activeFilter === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(cat.id)}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="categories-wrapper">
              {categories
                // 👈 ACÁ ESTÁ LA MAGIA DEL FILTRO
                .filter(category => activeFilter === 'ALL' || category.id === activeFilter)
                .map(category => {
                  const categoryPlans = plans.filter(p => p.planTypeId === category.id);
                  if (categoryPlans.length === 0) return null;

                  return (
                    <div key={category.id} className="category-block">
                      <div className="category-info reveal">
                        <h3>{category.name}</h3>
                        {category.description && <p>{category.description}</p>}
                      </div>

                      <div className="plans-grid-landing">
                        {categoryPlans.map(plan => (
                          <div key={plan.id} className="plan-card-landing reveal">
                            {/* ... (Acá adentro va exactamente todo el contenido de tu tarjeta de plan que ya tenías) ... */}
                            
                            <div className="plan-card-header">
                              <h4>{plan.title}</h4>
                              <span className="plan-duration">{plan.duration} Semanas</span>
                            </div>

                            <div className="plan-card-price">
                              <span className="price-ars">${plan.price}</span>
                              {plan.internationalPrice > 0 && (
                                <span className="price-usd">/ {plan.internationalPrice} USD</span>
                              )}
                            </div>

                            <p className="plan-description">
                              {plan.description || "Planificación estructurada para llevar tu nivel al máximo."}
                            </p>

                            <div className="plan-features">
                              <div className="feature-item">
                                <CheckCircle2 size={16} className="text-yellow" />
                                <span>Acceso a la App Exclusiva</span>
                              </div>
                              <div className="feature-item">
                                <CheckCircle2 size={16} className="text-yellow" />
                                <span>Videos Demostrativos</span>
                              </div>
                              <div className="feature-item">
                                <CheckCircle2 size={16} className="text-yellow" />
                                <span>Registro de Métricas</span>
                              </div>
                              
                              {plan.hasFollowUp && (
                                <div className="feature-item">
                                  {plan.outOfStock ? (
                                    <>
                                      <AlertCircle size={16} className="text-red" />
                                      <span className="text-red font-bold">Sin cupos de corrección</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={16} className="text-yellow" />
                                      <span className="text-highlight">Corrección y Seguimiento 1 a 1</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <button 
                              className="btn-buy-plan"
                              onClick={() => handleBuyClick(plan.id)}
                              disabled={plan.hasFollowUp && plan.outOfStock}
                            >
                              {(plan.hasFollowUp && plan.outOfStock) ? 'Agotado' : 'Quiero empezar'}
                            </button>

                          </div>
                        ))}
                      </div>
                    </div>
                  )
              })}
            </div>
          </>
        )}
      </section>
        {/* --- FOOTER --- */}
      <footer className="landing-footer">
        <div className="footer-content">
          
          <div className="footer-brand">
            <img src="/logob.png" alt="Don't Quit Logo" className="footer-logo" />
            <p>Planificación inteligente para atletas reales. Encontrá el equilibrio y llevá tu rendimiento al máximo.</p>
          </div>
          
          <div className="footer-links">
            <h4>Navegación</h4>
            <button onClick={scrollToPlans}>Catálogo de Programas</button>
            <button onClick={() => navigate('/login')}>Entrar a la App</button>
          </div>

          <div className="footer-contact">
            <h4>Contacto y Redes</h4>
            
            <a href="mailto:dontquit.bahiablanca@gmail.com" className="contact-item">
              <Mail size={18} /> dontquit.bahiablanca@gmail.com
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