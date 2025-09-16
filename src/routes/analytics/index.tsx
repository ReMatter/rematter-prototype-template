import { Row, Col, Card, Typography, Select, DatePicker, Space } from 'antd'
import { BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons'

const { Title } = Typography
const { RangePicker } = DatePicker

export const Analytics = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Analytics
        </Title>

        <Space>
          <Select
            defaultValue="7d"
            style={{ width: 120 }}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <RangePicker />
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>Performance Chart</Title>
              <p>Track your P&L performance over time with detailed charts and metrics.</p>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <LineChartOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>Trend Analysis</Title>
              <p>Analyze market trends and patterns to optimize your trading strategy.</p>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <PieChartOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
              <Title level={4}>Asset Allocation</Title>
              <p>View your portfolio distribution across different assets and sectors.</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="P&L Over Time" style={{ height: '400px' }}>
            <div style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9'
            }}>
              <p style={{ color: '#999' }}>Chart visualization will be rendered here</p>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Key Metrics" style={{ height: '400px' }}>
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>Sharpe Ratio:</strong> 1.24
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Max Drawdown:</strong> -8.5%
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Total Return:</strong> 23.7%
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Volatility:</strong> 12.3%
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Alpha:</strong> 0.85
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Beta:</strong> 1.12
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}