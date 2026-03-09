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

  // 👈 NUEVO: Buscamos si existe alguna categoría que tenga planes gratis
  // Buscamos si alguna de las categorías tiene la palabra "FREE" o "GRATIS" en el nombre, 
  // o si simplemente querés guiarte por los planes cuyo precio es 0.
  // En este caso, buscaremos si hay AL MENOS UN plan gratis, y encontraremos su categoría.
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
  }, [loading, plans, activeFilter, subFilters]);

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
      <section id="catalogo-section" className="catalog-section">
        <div className="catalog-header reveal">
          <h2>Elegí tu Programa</h2>
          <p>Diferentes niveles y objetivos, con la misma metodología.</p>
        </div>

        {loading ? (
          <div className="catalog-loading">Cargando programas disponibles...</div>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="catalog-filters reveal">
                <button 
                  className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('ALL')}
                >
                  Todos
                </button>
                
                {categories.map(cat => {
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
                .filter(category => activeFilter === 'ALL' || category.id === activeFilter)
                .map(category => {
                  const allCategoryPlans = plans.filter(p => p.planTypeId === category.id);
                  if (allCategoryPlans.length === 0) return null;

                  const currentSubFilter = subFilters[category.id] || 'ALL';
                  
                  const hasFollowUpPlans = allCategoryPlans.some(p => p.hasFollowUp);
                  const hasNoFollowUpPlans = allCategoryPlans.some(p => !p.hasFollowUp);
                  const showSubFilters = hasFollowUpPlans && hasNoFollowUpPlans;

                  const displayedPlans = allCategoryPlans.filter(p => {
                    if (currentSubFilter === 'WITH') return p.hasFollowUp === true;
                    if (currentSubFilter === 'WITHOUT') return p.hasFollowUp === false;
                    return true; 
                  });

                  if (displayedPlans.length === 0) return null; 

                  return (
                    <div key={category.id} className="category-block">
                      <div className="category-info reveal">
                        <h3>{category.name}</h3>
                        {category.description && <p>{category.description}</p>}
                        
                        {showSubFilters && (
                          <div className="subfilter-container">
                            <button 
                              className={`subfilter-btn ${currentSubFilter === 'WITH' ? 'active' : ''}`}
                              onClick={() => handleSubFilterChange(category.id, 'WITH')}
                            >
                              Con Seguimiento
                            </button>
                            <button 
                              className={`subfilter-btn ${currentSubFilter === 'WITHOUT' ? 'active' : ''}`}
                              onClick={() => handleSubFilterChange(category.id, 'WITHOUT')}
                            >
                              Sin Seguimiento
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="plans-grid-landing">
                        {displayedPlans.map(plan => {
                          const isFree = plan.price === 0; 

                          return (
                            <div key={plan.id} className={`plan-card-landing reveal ${isFree ? 'free-plan-card' : ''}`}>
                              
                              <div className="plan-card-header">
                                <h4>{plan.title}</h4>
                                <span className="plan-duration">{plan.duration} Semanas</span>
                              </div>

                              <div className="plan-card-price">
                                {isFree ? (
                                  <span className="price-free">¡GRATIS!</span>
                                ) : (
                                  <>
                                    <span className="price-ars">${plan.price.toLocaleString()}</span>
                                    {plan.internationalPrice > 0 && (
                                      <span className="price-usd">/ {plan.internationalPrice} USD</span>
                                    )}
                                  </>
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
                                className={`btn-buy-plan ${isFree ? 'btn-free-plan' : ''}`}
                                onClick={() => handleBuyClick(plan.id)}
                                disabled={plan.hasFollowUp && plan.outOfStock}
                              >
                                {(plan.hasFollowUp && plan.outOfStock) ? 'Agotado' : (isFree ? 'Empezar Prueba Gratis' : 'Quiero empezar')}
                              </button>

                            </div>
                          );
                        })}
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