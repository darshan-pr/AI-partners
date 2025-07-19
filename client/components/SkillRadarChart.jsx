"use client";
import { useEffect, useRef, useState } from 'react';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SkillRadarChart({ concepts }) {
  const chartRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now()); // Add key for forcing re-render
  
  // Set mounted state after component mounts to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
      // Force chart re-render on theme change
      setChartKey(Date.now());
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    // Debug: Check if concepts data is available
    if (concepts) {
      console.log('Concepts data received:', concepts);
    } else {
      console.log('No concepts data available');
    }
    
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [concepts]);
  
  // If not mounted, show a placeholder
  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  // Ensure we have concepts to display
  if (!concepts || concepts.length < 2) {
    console.log('Not enough concept data for radar chart');
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Not enough data to generate chart (minimum 2 concepts required)
        </p>
      </div>
    );
  }
  
  // Convert concept mastery levels to numerical values
  const getScoreFromLevel = (level) => {
    switch(level) {
      case "Strong": return 85;
      case "Moderate": return 65;
      case "Needs Improvement": return 35;
      default: return 50;
    }
  };
  
  // If we have too many concepts, limit to the most important ones
  const sortedConcepts = [...concepts].sort((a, b) => {
    const scoreA = getScoreFromLevel(a.mastery_level);
    const scoreB = getScoreFromLevel(b.mastery_level);
    return scoreA - scoreB; // Sort ascending so weakest concepts come first
  });
  
  // Take up to 6 concepts for better readability
  const displayConcepts = sortedConcepts.slice(0, 6);
  console.log('Displaying concepts:', displayConcepts);
  
  const labels = displayConcepts.map(c => c.concept);
  const scores = displayConcepts.map(c => getScoreFromLevel(c.mastery_level));
  
  // Chart data
  const data = {
    labels,
    datasets: [
      {
        label: 'Concept Mastery',
        data: scores,
        backgroundColor: 'rgba(138, 43, 226, 0.2)',
        borderColor: 'rgba(138, 43, 226, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(138, 43, 226, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(138, 43, 226, 1)'
      }
    ]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif"
          },
          color: isDarkMode ? '#f3f4f6' : '#1f2937'
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          font: {
            size: 10
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: isDarkMode ? '#f3f4f6' : '#1f2937',
        bodyColor: isDarkMode ? '#f3f4f6' : '#1f2937',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: function(context) {
            const level = displayConcepts[context.dataIndex].mastery_level;
            return `Mastery: ${context.raw}% (${level})`;
          }
        }
      }
    }
  };
  
  // Debug rendering
  console.log('Rendering chart with data:', scores);
  
  return (
    <div className="radar-chart-container h-full w-full flex items-center justify-center">
      <Radar 
        key={chartKey} 
        ref={chartRef} 
        data={data} 
        options={options}
        className="max-h-full max-w-full"
      />
    </div>
  );
}