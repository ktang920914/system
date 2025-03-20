import React, { useEffect, useState } from 'react'
import {useLocation} from 'react-router-dom'
import DashSidebar from '../components/DashSidebar'
import Profile from '../components/Profile'
import ChangePassword from '../components/ChangePassword'
import Area from '../components/Area'
import Tables from '../components/Tables'
import ReserveTable from '../components/ReserveTable'
import ReserveReport from '../components/ReserveReport'
import Cashier from '../components/Cashier'
import Bill from '../components/Bill'
import Product from '../components/Product'
import SubCategory from '../components/SubCategory'
import Printer from '../components/Printer'
import ProductPrinter from '../components/ProductPrinter'
import Inventory from '../components/Inventory'
import Stock from '../components/Stock'
import StockReport from '../components/StockReport'

const Dashboard = () => {
  
  const location = useLocation()
  const [tab,setTab] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabFromUrl = urlParams.get('tab')
    if(tabFromUrl){
      setTab(tabFromUrl)
    }
  },[location.search])

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      <div className='md:w-56'>
        {/* side bar */}
        <DashSidebar/>
      </div>
        {/* profile */}
        { tab === 'profile' && <Profile/>}
        {/* change password */}
        { tab === 'password' && <ChangePassword/>}
        {/* area */}
        { tab === 'area' && <Area/>}
        {/* table */}
        { tab === 'table' && <Tables/>}
        {/* printer */}
        { tab === 'printer' && <Printer/>}
        {/* reserve */}
        { tab === 'reserve' && <ReserveTable/>}
        {/* reserve-report */}
        { tab === 'reserve-report' && <ReserveReport/>}
        {/* cashier */}
        { tab === 'cashier' && <Cashier/>}
        {/* bill */}
        { tab === 'bill' && <Bill/>}
        {/* product */}
        { tab === 'product' && <Product/>}
        {/* sub category */}
        { tab === 'sub-category' && <SubCategory/>}
        {/* product printer */}
        { tab === 'product-printer' && <ProductPrinter/>}
        {/* inventory */}
        { tab === 'inventory' && <Inventory/>}
        {/* stock */}
        { tab === 'stock' && <Stock/>}
        {/* stock */}
        { tab === 'stock-report' && <StockReport/>}
    </div>
  )
}

export default Dashboard