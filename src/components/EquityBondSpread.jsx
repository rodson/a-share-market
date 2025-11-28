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
        p: 1, 
        textAlign: 'center',
        borderBottom: '2px solid #4a4a4a'
      }}>
        <Typography sx={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#fff'
        }}>
          A股整体（万得全A指数）
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
        <Box sx={{ bgcolor: '#fff', height: '100%' }}>
          <Box sx={{ bgcolor: '#ffeda0', p: 1, borderBottom: '1px solid #ccc' }}>
            <Typography sx={{ 
              fontSize: '20px', 
              fontWeight: 'normal', 
              color: '#000',
              textAlign: 'center'
            }}>
              股债利差估值分位
            </Typography>
          </Box>
          <Box sx={{ bgcolor: '#ffeda0', p: 1, borderBottom: '1px solid #ccc' }}>
            <Typography sx={{ 
              fontSize: '28px', 
              fontWeight: 'normal', 
              color: '#000',
              textAlign: 'center'
            }}>
              {metrics.spreadPercentile}%
            </Typography>
          </Box>
          
          {/* PB和PE指标 */}
          <Grid container spacing={0} sx={{ height: '40px' }}>
            <Grid item xs={3} sx={{ bgcolor: '#ffeda0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                PB
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ffeda0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                {metrics.pb}
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ffeda0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                PB分位
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ffeda0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                {metrics.pbPercentile}%
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* 右侧：股债利差 */}
        <Box sx={{ bgcolor: '#fff', height: '100%' }}>
          <Box sx={{ bgcolor: '#ffeda0', p: 1, borderBottom: '1px solid #ccc', borderLeft: '1px solid #999' }}>
             <Typography sx={{ 
              fontSize: '20px', 
              fontWeight: 'normal', 
              color: '#000',
              textAlign: 'center'
            }}>
              股债利差
            </Typography>
          </Box>
          <Box sx={{ bgcolor: '#ffeda0', p: 1, borderBottom: '1px solid #ccc', borderLeft: '1px solid #999' }}>
            <Typography sx={{ 
              fontSize: '28px', 
              fontWeight: 'normal', 
              color: '#000',
              textAlign: 'center'
            }}>
              {metrics.spread}%
            </Typography>
          </Box>
          
          {/* PE指标 */}
          <Grid container spacing={0} sx={{ height: '40px' }}>
            <Grid item xs={3} sx={{ bgcolor: '#ff9999', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc', borderLeft: '1px solid #999' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                PE
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ff9999', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                {metrics.pe}
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ff9999', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                PE分位
              </Typography>
            </Grid>
            <Grid item xs={3} sx={{ bgcolor: '#ff9999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '18px', color: '#000' }}>
                {metrics.pePercentile}%
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 图表区域 */}
      <Box sx={{ bgcolor: '#6a6a6a', pt: 1, pb: 0, pl: 1, pr: 1 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#888" vertical={false} />
            <XAxis 
              dataKey="displayYear" 
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 12 }}
              interval={0}
              tickFormatter={(value) => value || ''}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 12 }}
              domain={[-2.0, 8.0]}
              tickCount={6}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#fff"
              tick={{ fill: '#fff', fontSize: 12 }}
              domain={[0, 8000]}
              tickCount={5}
              axisLine={false}
              tickLine={false}
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
                if (name === '万得全A') return [value.toFixed(0) + '点', name];
                return [value, name];
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="plainline"
              wrapperStyle={{ top: -5 }}
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

      {/* 底部：十年国债 */}
      <Box sx={{ 
        bgcolor: '#e6f3ff',
        display: 'flex',
        borderTop: '1px solid #4a4a4a'
      }}>
        <Box sx={{ flex: 1, bgcolor: '#e6f3ff', p: 1, textAlign: 'center', borderRight: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '20px', color: '#000' }}>
            十年国债
          </Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#e6f3ff', p: 1, textAlign: 'center', borderRight: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '20px', color: '#000' }}>
            利率
          </Typography>
        </Box>
        <Box sx={{ flex: 2, bgcolor: '#e6f3ff', p: 1, textAlign: 'center', borderRight: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '24px', color: '#000' }}>
            {metrics.bond10Y}%
          </Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#e6f3ff', p: 1, textAlign: 'center', borderRight: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '20px', color: '#000' }}>
            利率分位
          </Typography>
        </Box>
        <Box sx={{ flex: 2, bgcolor: '#e6f3ff', p: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '24px', color: '#000' }}>
            {metrics.bond10YPercentile}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default EquityBondSpread;