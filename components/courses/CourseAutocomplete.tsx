"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  city?: string;
  state?: string;
  tees: Array<{
    id: string;
    name: string;
    courseRating?: number;
    slopeRating?: number;
    par: number;
  }>;
}

interface CourseAutocompleteProps {
  onSelectCourse: (course: Course | null) => void;
  selectedCourse?: Course | null;
}

export default function CourseAutocomplete({
  onSelectCourse,
  selectedCourse,
}: CourseAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchCourses = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setCourses([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/courses?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error("Failed to search courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query) {
      searchCourses(query);
    } else {
      setCourses([]);
    }
  }, [query, searchCourses]);

  const handleSelectCourse = (course: Course) => {
    onSelectCourse(course);
    setQuery(course.name);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onSelectCourse(null);
    setQuery("");
    setCourses([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">Course</label>

      {selectedCourse ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
          <div>
            <div className="font-medium">{selectedCourse.name}</div>
            {(selectedCourse.city || selectedCourse.state) && (
              <div className="text-sm text-gray-600">
                {[selectedCourse.city, selectedCourse.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {selectedCourse.tees.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedCourse.tees.length} tee{selectedCourse.tees.length !== 1 ? "s" : ""} available
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-red-600 hover:text-red-800 px-3 py-1 text-sm"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a golf course..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {isOpen && (query.length >= 2 || courses.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              ) : courses.length > 0 ? (
                <>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{course.name}</div>
                      {(course.city || course.state) && (
                        <div className="text-sm text-gray-600">
                          {[course.city, course.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {course.tees.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {course.tees.map((t) => t.name).join(", ")}
                        </div>
                      )}
                    </button>
                  ))}
                </>
              ) : query.length >= 2 ? (
                <div className="p-4">
                  <p className="text-gray-500 mb-2">No courses found</p>
                  <button
                    type="button"
                    onClick={() => {
                      // This would open a course creation modal
                      alert("Course creation modal would open here");
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Create &quot;{query}&quot; as new course
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
