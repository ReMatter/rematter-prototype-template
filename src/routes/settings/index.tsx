import { Card, Form, Input, Switch, Button, Select, Divider, Typography, Space } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export const Settings = () => {
  const [form] = Form.useForm()

  const onFinish = (values: any) => {
    console.log('Form values:', values)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Settings
      </Title>

      <Card title="General Settings" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            notifications: true,
            darkMode: false,
            currency: 'USD',
            timezone: 'UTC',
          }}
        >
          <Form.Item
            label="Display Name"
            name="displayName"
            rules={[{ required: true, message: 'Please enter your display name' }]}
          >
            <Input placeholder="Enter your display name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item label="Default Currency" name="currency">
            <Select style={{ width: 200 }}>
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="EUR">EUR</Select.Option>
              <Select.Option value="GBP">GBP</Select.Option>
              <Select.Option value="JPY">JPY</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Timezone" name="timezone">
            <Select style={{ width: 200 }}>
              <Select.Option value="UTC">UTC</Select.Option>
              <Select.Option value="America/New_York">Eastern Time</Select.Option>
              <Select.Option value="America/Los_Angeles">Pacific Time</Select.Option>
              <Select.Option value="Europe/London">London</Select.Option>
              <Select.Option value="Asia/Tokyo">Tokyo</Select.Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item
            label="Enable Notifications"
            name="notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Dark Mode"
            name="darkMode"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Auto-refresh Data"
            name="autoRefresh"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Settings
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
                Reset to Default
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="API Configuration">
        <Text type="secondary">
          Configure your trading API settings and connections here.
        </Text>
        <div style={{ marginTop: '16px' }}>
          <Form layout="vertical">
            <Form.Item label="API Key">
              <Input.Password placeholder="Enter your API key" />
            </Form.Item>
            <Form.Item label="API Secret">
              <Input.Password placeholder="Enter your API secret" />
            </Form.Item>
            <Form.Item label="Sandbox Mode" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  )
}