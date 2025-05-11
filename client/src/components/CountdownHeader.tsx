import React from 'react';
import StandaloneTimer from './StandaloneTimer';
import BuzzerButton from './SocketBuzzer';
import { useTranslation } from 'react-i18next';

export default function CountdownHeader() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-black py-3 border-t border-b border-zinc-800 mb-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {/* Studio A */}
          <div className="p-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                {/* Countdown Timer */}
                <div className="flex-1">
                  <StandaloneTimer studio="A" variant="producer" />
                </div>
                
                {/* Buzzer Button - styled to match countdown */}
                <div className="ml-1 h-20">
                  <div className="grid grid-cols-1 items-center rounded-md h-full w-36 bg-white shadow-lg border border-zinc-700">
                    <BuzzerButton isProducer={true} studioId="A" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Studio B */}
          <div className="p-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                {/* Countdown Timer */}
                <div className="flex-1">
                  <StandaloneTimer studio="B" variant="producer" />
                </div>
                
                {/* Buzzer Button - styled to match countdown */}
                <div className="ml-1 h-20">
                  <div className="grid grid-cols-1 items-center rounded-md h-full w-36 bg-white shadow-lg border border-zinc-700">
                    <BuzzerButton isProducer={true} studioId="B" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}