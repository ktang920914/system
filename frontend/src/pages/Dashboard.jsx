import React, { useEffect, useState } from 'react'
import {useLocation} from 'react-router-dom'
import DashSidebar from '../components/DashSidebar'
import Profile from '../components/Profile'
import ChangePassword from '../components/ChangePassword'
import Area from '../components/Area'

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
        {/* change password */}
        { tab === 'area' && <Area/>}
    </div>
  )
}

export default Dashboard