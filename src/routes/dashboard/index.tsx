import { Row, Col, Card, Statistic, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, TrendingUpOutlined } from '@ant-design/icons'

const { Title } = Typography

export const Dashboard = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard
      </Title>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total P&L"
              value={11280}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's P&L"
              value={542}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Positions"
              value={15}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TrendingUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Win Rate"
              value={67.8}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Recent Trades" style={{ height: '300px' }}>
            <p>Trade history will be displayed here...</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Portfolio Overview" style={{ height: '300px' }}>
            <p>Portfolio charts and metrics will be displayed here...</p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}