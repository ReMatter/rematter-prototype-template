import { Layout, Menu } from 'antd'
import { DashboardOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons'
import { Link, useLocation } from 'wouter'

const { Sider } = Layout

export const SideBar = () => {
  const [location] = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">Dashboard</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link href="/analytics">Analytics</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">Settings</Link>,
    },
  ]

  const getSelectedKey = () => {
    if (location === '/analytics') return ['/analytics']
    if (location === '/settings') return ['/settings']
    return ['/']
  }

  return (
    <Sider
      collapsible
      width={200}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={getSelectedKey()}
        items={menuItems}
        style={{
          height: '100%',
          borderRight: 0,
        }}
      />
    </Sider>
  )
}