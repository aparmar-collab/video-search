import React from 'react';
import { Play, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { formatTimestamp } from '../utils/formatTime';
import { use_thumbnail } from '../hooks/useThumbnail';

const VideoClipCard = ({ clip, onClick }) => {
  const { video_id, video_path, timestamp_start, timestamp_end, clip_text, score } = clip;
  
  const confidence_level = score > 0.8 ? 'HIGH' : score > 0.5 ? 'MEDIUM' : 'LOW';
  const confidence_color = score > 0.8 ? 'bg-green-100 text-green-700' : score > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';

  // Load thumbnail from video
  const { thumbnail, isLoading: thumbnailLoading, error: thumbnailError } = use_thumbnail(
    video_path, 
    video_id, 
    timestamp_start
  );

  return (
    <div 
      className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:border-blue-200 border border-transparent transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onClick(clip)}
    >
      {/* Video Thumbnail */}
      <div className="relative h-52 bg-gray-200 flex items-center justify-center overflow-hidden">
        {/* Loading state */}
        {thumbnailLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <Loader2 size={40} className="text-gray-400 animate-spin" />
          </div>
        )}
        
        {/* Error state */}
        {thumbnailError && !thumbnail && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-gray-600 p-4">
            <div className="text-red-400 text-sm text-center mb-2">
              Unable to load thumbnail
            </div>
            <div className="text-xs text-gray-400 text-center">
              CORS not enabled on video
            </div>
          </div>
        )}
        
        {/* Actual thumbnail */}
        {thumbnail && (
          <img 
            src={thumbnail} 
            alt={`Thumbnail at ${formatTimestamp(timestamp_start)}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Timestamp overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatTimestamp(timestamp_start)}
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        <p className="text-md font-semibold truncate text-gray-900">
          {clip_text || 'Video clip segment'}
        </p>
      </div>
    </div>
  );
};

export default VideoClipCard;
