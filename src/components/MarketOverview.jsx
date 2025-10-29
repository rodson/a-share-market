import React from 'react';
import { Box, Typography } from '@mui/material';

const MarketOverview = ({ data }) => {
  if (!data) return null;

  const getColor = (value) => {
    if (value > 0) return '#ff4444';
    if (value < 0) return '#00cc66';
    return '#999';
  };

  const formatPercent = (value) => {
    if (value === 0) return '0.00%';
    return value > 0 ? `${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  };

  return (
    <Box sx={{ bgcolor: '#5a5a5a', p: 1.5, mb: 0 }}>
      {/* 顶部标题栏 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        bgcolor: '#6a6a6a',
        px: 2,
        py: 0.5,
        mb: 1
      }}>
        <Typography sx={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
          AB股涨跌（万得A股）
        </Typography>
        <Typography sx={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
          涨跌幅
        </Typography>
      </Box>

      {/* 涨跌统计 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        bgcolor: '#5a5a5a'
      }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11px', color: '#ccc' }}>涨停</Typography>
            <Typography sx={{ fontSize: '16px', color: '#ff4444', fontWeight: 'bold' }}>
              {data.upLimit || 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11px', color: '#ccc' }}>上涨</Typography>
            <Typography sx={{ fontSize: '16px', color: '#ff4444', fontWeight: 'bold' }}>
              {data.up || 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11px', color: '#ccc' }}>平盘</Typography>
            <Typography sx={{ fontSize: '16px', color: '#999', fontWeight: 'bold' }}>
              {data.flat || 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11px', color: '#ccc' }}>下跌</Typography>
            <Typography sx={{ fontSize: '16px', color: '#00cc66', fontWeight: 'bold' }}>
              {data.down || 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11px', color: '#ccc' }}>跌停</Typography>
            <Typography sx={{ fontSize: '16px', color: '#00cc66', fontWeight: 'bold' }}>
              {data.downLimit || 0}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '20px', color: getColor(data.changePercent), fontWeight: 'bold' }}>
            {formatPercent(data.changePercent || 0)}
          </Typography>
        </Box>
      </Box>

      {/* 主要指数行 */}
      <Box sx={{ 
        display: 'flex',
        gap: 0.5,
        px: 2,
        py: 1,
        bgcolor: '#5a5a5a',
        flexWrap: 'wrap'
      }}>
        {data.indices && data.indices.map((index, i) => (
          <Box 
            key={i}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              bgcolor: i % 2 === 0 ? '#6a6a6a' : '#5a5a5a',
              borderRadius: 0.5
            }}
          >
            <Typography sx={{ fontSize: '12px', color: '#fff', minWidth: '60px' }}>
              {index.name}
            </Typography>
            <Typography sx={{ 
              fontSize: '13px', 
              color: getColor(index.changePercent),
              fontWeight: 'bold',
              minWidth: '60px',
              textAlign: 'right'
            }}>
              {formatPercent(index.changePercent)}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#aaa', minWidth: '80px', textAlign: 'right' }}>
              {index.volume}亿
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MarketOverview;
