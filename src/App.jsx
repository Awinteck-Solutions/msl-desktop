import { useState } from "react";
import {Routes, Route, HashRouter as Router, Outlet,useNavigate} from "react-router-dom"; 

import Login from './Pages/Login'
import Dashboard from "./Pages/Dashboard";
import Course from './Pages/Course'
import MyCourses from './Pages/MyCourses'
import PreviewCourse from "./Pages/PreviewCourse";
import PreviewPdf from "./Pages/PreviewPdf";
import Feedback from "./Pages/Feedback";




function App() {
  return (
    <Router>
      <Routes>  
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/course" element={<Course />} />
        <Route path="/personal/course" element={<MyCourses />} />
        <Route path="*" element={<Dashboard />} />
        <Route path="/course/preview/:id" element={<PreviewCourse />} />
        <Route path="/preview/pdf/:id" element={<PreviewPdf />} />
        <Route path="/feedback" element={<Feedback />} />

      </Routes>
    </Router>
  );
}

export default App;
