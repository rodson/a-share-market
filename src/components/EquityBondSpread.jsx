import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const EquityBondSpread = ({ data }) => {
  if (!data) return null;

  const { metrics, chartData } = data;

  return (
    <Box sx={{ bgcolor: '#5a5a5a', mb: 0 }}>
      {/* 标题 */}
      <Box sx={{ 
        bgcolor: '#6a6a6a', 
        p: 2, 
        textAlign: 'center',
        borderBottom: '2px solid #4a4a4a'
      }}>
        <Typography sx={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#fff'
        }}>
          A股整体（沪深300指数）
        </Typography>
      </Box>
      
      {/* 顶部指标区域 */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        borderBottom: '2px solid #4a4a4a'
      }}>
        {/* 左侧：股债利差估值分位 */}
        <Box sx={{ bgcolor: '#d4b896', p: 2, borderRight: '1px solid #4a4a4a' }}>
          <Typography sx={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#333',
            textAlign: 'center',
            mb: 1
          }}>
            股债利差估值分位
          </Typography>
          <Typography sx={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#333',
            textAlign: 'center'
          }}>
            {metrics.spreadPercentile}%
          </Typography>
          
          {/* PB和PE指标 */}
          <Grid container spacing={0} sx={{ mt: 2 }}>
            <Grid item xs={3} sx={{ bgcolor: '#c9a876', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                PB
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#d4b896', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {metrics.pb}
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#c9a876', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                PB分位
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#d4b896', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {metrics.pbPercentile}%
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* 右侧：股债利差 */}
        <Box sx={{ bgcolor: '#f4c4c4', p: 2 }}>
          <Typography sx={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#333',
            textAlign: 'center',
            mb: 1
          }}>
            股债利差
          </Typography>
          <Typography sx={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#333',
            textAlign: 'center'
          }}>
            {metrics.spread}%
          </Typography>
          
          {/* PE指标 */}
          <Grid container spacing={0} sx={{ mt: 2 }}>
            <Grid item xs={3} sx={{ bgcolor: '#e9b4b4', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                PE
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#f4c4c4', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {metrics.pe}
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#e9b4b4', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                PE分位
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#f4c4c4', p: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {metrics.pePercentile}%
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 十年国债利率 */}
      <Box sx={{ 
        bgcolor: '#a8c9e8',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        borderBottom: '2px solid #4a4a4a'
      }}>
        <Box sx={{ bgcolor: '#8eb3d4', p: 1.5, textAlign: 'center', borderRight: '1px solid #6a93b8' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            十年国债
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#a8c9e8', p: 1.5, textAlign: 'center', borderRight: '1px solid #6a93b8' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            利率
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#8eb3d4', p: 1.5, textAlign: 'center', borderRight: '1px solid #6a93b8' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            {metrics.bond10Y}%
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#a8c9e8', p: 1.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            利率分位
          </Typography>
        </Box>
        <Box sx={{ gridColumn: 'span 4', bgcolor: '#a8c9e8', p: 1.5, textAlign: 'center', borderTop: '1px solid #6a93b8' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            {metrics.bond10YPercentile}%
          </Typography>
        </Box>
      </Box>

      {/* 图表区域 */}
      <Box sx={{ bgcolor: '#6a6a6a', p: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#888" />
            <XAxis 
              dataKey="displayYear" 
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 11 }}
              interval="preserveStartEnd"
              tickFormatter={(value) => value || ''}
              label={{ 
                value: '年份 (2005年1月1日 - 2025年10月)', 
                position: 'insideBottom', 
                offset: -10,
                fill: '#ccc',
                fontSize: 11
              }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 11 }}
              domain={[-2, 8]}
              label={{ 
                value: '股债利差 (%)', 
                angle: -90, 
                position: 'insideLeft', 
                fill: '#fff',
                style: { textAnchor: 'middle' }
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 11 }}
              domain={[0, 8000]}
              label={{ 
                value: '沪深300 (点)', 
                angle: 90, 
                position: 'insideRight', 
                fill: '#fff',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff'
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return `日期: ${payload[0].payload.date}`;
                }
                return label;
              }}
              formatter={(value, name) => {
                if (name === '股债利差') return [value.toFixed(2) + '%', name];
                if (name === '沪深300') return [value.toFixed(0) + '点', name];
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#fff', paddingTop: '10px' }}
              iconType="line"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="spread" 
              name="股债利差"
              stroke="#ff8844" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="windA" 
              name="万得全A"
              stroke="#6699ff" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default EquityBondSpread;
