import {BrowserRouter, Routes, Route} from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Memberships from "../pages/Memberships";
import Payments from "../pages/Payments";

export default function AppRoutes(){
    return(
        <BrowserRouter>
        <Routes>
            <Route path ="/dashboard" element={<Dashboard/>}/>
            <Route path ="/members" element={<Members/>}/>
            <Route path ="/memberships" element={<Memberships/>}/>
            <Route path ="/payments" element={<Payments/>}/>
        </Routes>
        </BrowserRouter>
    );
}