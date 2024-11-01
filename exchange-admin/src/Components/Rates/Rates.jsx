import React from 'react';
import Navbar from '../Dashboard/Navbar'
import './Rates.css'
import logo from '../Assets/logo.png'

const Rates = () => {

    return (
        <div>
            <Navbar />
            <img className="logo" src={logo} alt="" />
            <h1>RATES</h1>
        </div>
    );
}

export default Rates;