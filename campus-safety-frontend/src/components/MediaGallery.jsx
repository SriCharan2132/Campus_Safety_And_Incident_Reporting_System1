import { useState } from "react";

const BASE_URL = "https://campus-safety-and-incident-reporting-08jc.onrender.com";

function MediaGallery({ media }) {

  const [viewerOpen, setViewerOpen] = useState(false);

  if (!media || media.length === 0) {
    return <p className="text-sm text-gray-500">No media uploaded</p>;
  }

  const visibleMedia = media.slice(0, 3);
  const remaining = media.length - 3;

  return (

    <div className="bg-white p-6 rounded shadow">

      <h2 className="text-lg font-semibold mb-4">
        Media
      </h2>

      {/* Preview grid */}

      <div className="grid grid-cols-3 gap-4">

        {visibleMedia.map((m, index) => {

          const mediaUrl = `${BASE_URL}${m.fileUrl}`;

          return (

            <div
              key={m.id}
              className="relative cursor-pointer"
              onClick={() => setViewerOpen(true)}
            >

              {m.contentType?.startsWith("image") ? (

                <img
                  src={mediaUrl}
                  className="w-full h-40 object-cover rounded"
                  alt="incident"
                />

              ) : (

                <video
                  className="w-full h-40 object-cover rounded"
                >
                  <source
                    src={mediaUrl}
                    type={m.contentType}
                  />
                </video>

              )}

              {index === 2 && remaining > 0 && (

                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold rounded">

                  +{remaining}

                </div>

              )}

            </div>

          );

        })}

      </div>

      {/* Fullscreen viewer */}

      {viewerOpen && (

        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto p-10">

          <button
            className="fixed top-5 right-5 text-white text-3xl"
            onClick={() => setViewerOpen(false)}
          >
            ✕
          </button>

          <div className="flex flex-col gap-10 items-center">

            {media.map((m) => {

              const mediaUrl = `${BASE_URL}${m.fileUrl}`;

              return m.contentType?.startsWith("image") ? (

                <img
                  key={m.id}
                  src={mediaUrl}
                  className="max-w-[90%] rounded"
                  alt="incident"
                />

              ) : (

                <video
                  key={m.id}
                  controls
                  className="max-w-[90%]"
                >
                  <source
                    src={mediaUrl}
                    type={m.contentType}
                  />
                </video>

              );

            })}

          </div>

        </div>

      )}

    </div>

  );
}

export default MediaGallery;