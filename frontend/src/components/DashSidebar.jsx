import React, { useEffect, useState } from 'react';
import { Sidebar } from 'flowbite-react';
import { HiUser, HiArrowSmRight } from 'react-icons/hi';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signOutSuccess } from '../redux/user/userSlice'
import { IoMdLock } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { MdPlace } from "react-icons/md";
import { MdTableBar } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { IoMdTime } from "react-icons/io";
import { TbReport } from "react-icons/tb";
import { TbCashRegister } from "react-icons/tb";
import { MdOutlineEventSeat } from "react-icons/md";
import { IoReceiptOutline } from "react-icons/io5";
import { AiOutlineGift } from "react-icons/ai";
import { IoCreateOutline } from "react-icons/io5";
import { PiArrowsSplit } from "react-icons/pi";
import { BsPrinter } from "react-icons/bs";
import { TiPrinter } from "react-icons/ti";
import { TbTransferIn } from "react-icons/tb";
import { PiWarehouse } from "react-icons/pi";

const DashSidebar = () => {
  const location = useLocation();
  const [tab, setTab] = useState('');
  const dispatch = useDispatch()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
      })
      const data = await res.json()
      if(data.success === false){
        console.log(data.message)
      }
      if(res.ok){
        dispatch(signOutSuccess())
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Sidebar className='w-full md:w-56'>
      <Sidebar.Items>
        <Sidebar.ItemGroup className='flex flex-col gap-1'>
          <Link to='/dashboard?tab=profile'>
            <Sidebar.Item
              active={tab === 'profile'}
              icon={HiUser}
              label='USER'
              labelColor='dark'
              as='div'
            >
              Profile
            </Sidebar.Item>
          </Link>

          <Link to='/dashboard?tab=password'>
            <Sidebar.Item
              active={tab === 'password'}
              icon={IoMdLock}
              labelColor='dark'
              as='div'
            >
              Change Password
            </Sidebar.Item>
          </Link>

          <Sidebar.Collapse icon={IoMdSettings} label="Setting">
            <Link to='/dashboard?tab=area'>
              <Sidebar.Item
                active={tab === 'area'}
                icon={MdPlace}
                labelColor='dark'
                as='div'
              >
                Area
              </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=table'>
              <Sidebar.Item
                active={tab === 'table'}
                icon={MdTableBar}
                labelColor='dark'
                as='div'
              >
                Table
              </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=printer'>
              <Sidebar.Item
                active={tab === 'printer'}
                icon={BsPrinter}
                labelColor='dark'
                as='div'
              >
                Printer
              </Sidebar.Item>
            </Link>
          </Sidebar.Collapse>

          <Sidebar.Collapse icon={SlCalender} label="Reservation">
            <Link to='/dashboard?tab=reserve'>
              <Sidebar.Item
                active={tab === 'reserve'}
                icon={IoMdTime}
                labelColor='dark'
                as='div'
              >
                Reserve Table
              </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=reserve-report'>
              <Sidebar.Item
                active={tab === 'reserve-report'}
                icon={TbReport}
                labelColor='dark'
                as='div'
              >
                Reserve Report
              </Sidebar.Item>
            </Link>
          </Sidebar.Collapse>

          <Sidebar.Collapse icon={TbCashRegister} label="Cashier">
            <Link to='/dashboard?tab=cashier'>
              <Sidebar.Item
                active={tab === 'cashier'}
                icon={MdOutlineEventSeat}
                labelColor='dark'
                as='div'
              >
                Open Table
              </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=bill'>
              <Sidebar.Item
                active={tab === 'bill'}
                icon={IoReceiptOutline}
                labelColor='dark'
                as='div'
              >
                Bill Payment
              </Sidebar.Item>
            </Link>
          </Sidebar.Collapse>

          <Sidebar.Collapse icon={AiOutlineGift} label="Product">
            <Link to='/dashboard?tab=sub-category'>
                <Sidebar.Item
                  active={tab === 'sub-category'}
                  icon={PiArrowsSplit}
                  labelColor='dark'
                  as='div'
                >
                  Categorized
                </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=product'>
              <Sidebar.Item
                active={tab === 'product'}
                icon={IoCreateOutline}
                labelColor='dark'
                as='div'
              >
                Product Info
              </Sidebar.Item>
            </Link>

            <Link to='/dashboard?tab=product-printer'>
              <Sidebar.Item
                active={tab === 'product-printer'}
                icon={TiPrinter}
                labelColor='dark'
                as='div'
              >
                Product Printer
              </Sidebar.Item>
            </Link>
          </Sidebar.Collapse>

          <Sidebar.Collapse icon={PiWarehouse} label="Inventory">
            <Link to='/dashboard?tab=inventory'>
                <Sidebar.Item
                  active={tab === 'inventory'}
                  icon={TbTransferIn}
                  labelColor='dark'
                  as='div'
                >
                  Warehouse
                </Sidebar.Item>
            </Link>
          </Sidebar.Collapse>

          <Sidebar.Item onClick={handleSignOut} icon={HiArrowSmRight} className='cursor-pointer'>
            Sign Out
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
};

export default DashSidebar