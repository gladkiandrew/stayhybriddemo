import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Saves from './pages/Saves';
import Join from './pages/Join';
import ProfilePage from './pages/Profile';
import CreatorsBrowse from './pages/CreatorsBrowse';
import Dashboard from './pages/admin/Dashboard';
import UploadExercise from './pages/admin/UploadExercise';
import ManageExercises from './pages/admin/ManageExercises';
import Creators from './pages/admin/Creators';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/saves" element={<Saves />} />
            <Route path="/join" element={<Join />} />
            <Route path="/creators" element={<CreatorsBrowse />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/admin" element={<Dashboard />}>
              <Route path="upload" element={<UploadExercise />} />
              <Route path="exercises" element={<ManageExercises />} />
              <Route path="creators" element={<Creators />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
