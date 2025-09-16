import { Layout, Typography, Space, Avatar, Dropdown } from 'antd'
import { UserOutlined, BellOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'

const { Header } = Layout
const { Title } = Typography

export const TopBar = () => {
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ]

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
        Rematter PnL
      </Title>

      <Space size="middle">
        <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            style={{ cursor: 'pointer' }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Space>
    </Header>
  )
}