import React from 'react';
import { Box, Typography } from '@mui/material';

const SectorTable = ({ data }) => {
  if (!data || data.length === 0) return null;

  const getColor = (value) => {
    if (value > 0) return '#ff4444';
    if (value < 0) return '#00cc66';
    return '#999';
  };

  const formatPercent = (value) => {
    if (value === 0) return '0.0%';
    return value > 0 ? `${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  // 按类别分组
  const groupedData = data.reduce((acc, sector) => {
    const category = sector.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(sector);
    return acc;
  }, {});

  return (
    <Box sx={{ bgcolor: '#5a5a5a' }}>
      {Object.entries(groupedData).map(([category, sectors], catIndex) => (
        <Box key={category} sx={{ mb: 0 }}>
          {/* 分类标题 */}
          <Box sx={{ 
            bgcolor: '#6a6a6a',
            px: 2,
            py: 0.8,
            borderTop: catIndex > 0 ? '2px solid #4a4a4a' : 'none'
          }}>
            <Typography sx={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
              {category}
            </Typography>
          </Box>

          {/* 表格内容 */}
          <Box>
            {sectors.map((sector, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '140px 70px 100px 60px 100px 60px 100px',
                  alignItems: 'center',
                  px: 2,
                  py: 0.8,
                  bgcolor: index % 2 === 0 ? '#5a5a5a' : '#4a4a4a',
                  borderBottom: '1px solid #3a3a3a',
                  '&:hover': {
                    bgcolor: '#6a6a6a'
                  }
                }}
              >
                {/* 板块名称 */}
                <Typography sx={{ 
                  fontSize: '12px', 
                  color: '#fff',
                  fontWeight: sector.highlight ? 'bold' : 'normal'
                }}>
                  {sector.name}
                </Typography>

                {/* 涨跌幅 */}
                <Typography sx={{ 
                  fontSize: '13px', 
                  color: getColor(sector.changePercent),
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  {formatPercent(sector.changePercent)}
                </Typography>

                {/* 领涨股 */}
                <Typography sx={{ 
                  fontSize: '11px', 
                  color: '#ddd',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {sector.topGainer?.name || '-'}
                </Typography>

                {/* 领涨股涨幅 */}
                <Typography sx={{ 
                  fontSize: '11px', 
                  color: getColor(sector.topGainer?.changePercent || 0),
                  textAlign: 'right'
                }}>
                  {sector.topGainer ? formatPercent(sector.topGainer.changePercent) : '-'}
                </Typography>

                {/* 领跌股 */}
                <Typography sx={{ 
                  fontSize: '11px', 
                  color: '#ddd',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {sector.topLoser?.name || '-'}
                </Typography>

                {/* 领跌股跌幅 */}
                <Typography sx={{ 
                  fontSize: '11px', 
                  color: getColor(sector.topLoser?.changePercent || 0),
                  textAlign: 'right'
                }}>
                  {sector.topLoser ? formatPercent(sector.topLoser.changePercent) : '-'}
                </Typography>

                {/* 涨跌家数 */}
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Typography sx={{ fontSize: '11px', color: '#ff4444' }}>
                    {sector.upCount || 0}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#999' }}>/</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#00cc66' }}>
                    {sector.downCount || 0}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default SectorTable;
