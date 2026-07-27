import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sime_token');
    const userData = localStorage.getItem('sime_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('sime_token', token);
      localStorage.setItem('sime_user', JSON.stringify(userData));
      
      try {
        const perfilResponse = await authService.getPerfil();
        const perfilData = perfilResponse.data;
        userData.foto = perfilData.foto || null;
        localStorage.setItem('sime_user', JSON.stringify(userData));
      } catch (e) {}
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('sime_token');
    localStorage.removeItem('sime_user');
    setUser(null);
  };

  const isAuthenticated = !!user;

  const hasRole = (...roles) => {
    return user && roles.includes(user.perfil);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};