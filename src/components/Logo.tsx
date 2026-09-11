import React from 'react'

export default function Logo() {
  return (
    <div className='flex gap-2 justify-center items-center w-fit h-fit'>
      <div className='p-2 bg-primary rounded-sm'>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_22_528)">
            <path d="M10.977 4.99976C10.4283 2.82425 9.30101 1.3328 7.99967 1.3328C6.15901 1.3328 4.66634 4.31771 4.66634 8C4.66634 11.6823 6.15901 14.6672 7.99967 14.6672C8.22767 14.6672 8.45101 14.6212 8.66634 14.5339M10.1292 9.13811L12.6719 10.3782L11.4319 12.9211M12.6663 10.3802C11.4637 10.9702 9.81701 11.3336 7.99967 11.3336C4.31767 11.3336 1.33301 9.84082 1.33301 8C1.33301 6.15919 4.31767 4.6664 7.99967 4.6664C11.225 4.6664 13.915 5.81183 14.533 7.33328" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </g>
          <defs>
            <clipPath id="clip0_22_528">
              <rect width="28" height="28" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <span className='font-bold'>Morph</span>
    </div>
  )
}
