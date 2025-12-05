'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { toast } from 'sonner';
import { Search, Link as LinkIcon, Unlink, ExternalLink } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  permitId: string;
  county: string | null;
  esmrFacilityId: number | null;
  esmrFacility: {
    facilityPlaceId: number;
    facilityName: string;
    regionCode: string;
  } | null;
}

interface ESMRFacility {
  facilityPlaceId: number;
  facilityName: string;
  regionCode: string;
  receivingWaterBody: string | null;
}

export default function FacilityLinkingPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [esmrFacilities, setEsmrFacilities] = useState<ESMRFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [esmrSearchTerm, setEsmrSearchTerm] = useState('');
  const [showLinkedOnly, setShowLinkedOnly] = useState(false);
  const [showUnlinkedOnly, setShowUnlinkedOnly] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [facilitiesRes, esmrRes] = await Promise.all([
        fetch('/api/admin/facility-link?type=facilities'),
        fetch('/api/admin/facility-link?type=esmr'),
      ]);

      if (!facilitiesRes.ok || !esmrRes.ok) {
        throw new Error('Failed to load data');
      }

      const facilitiesData = await facilitiesRes.json();
      const esmrData = await esmrRes.json();

      setFacilities(facilitiesData);
      setEsmrFacilities(esmrData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load facility data');
    } finally {
      setLoading(false);
    }
  }

  async function linkFacilities(facilityId: string, esmrFacilityId: number) {
    try {
      const res = await fetch('/api/admin/facility-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, esmrFacilityId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to link facilities');
      }

      toast.success('Facilities linked successfully');
      await loadData();
      setSelectedFacility(null);
      setEsmrSearchTerm('');
    } catch (error) {
      console.error('Error linking facilities:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link facilities');
    }
  }

  async function unlinkFacility(facilityId: string) {
    try {
      const res = await fetch('/api/admin/facility-link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unlink facility');
      }

      toast.success('Facility unlinked successfully');
      await loadData();
      setSelectedFacility(null);
    } catch (error) {
      console.error('Error unlinking facility:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unlink facility');
    }
  }

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.permitId.toLowerCase().includes(searchTerm.toLowerCase());

    if (showLinkedOnly) {
      return matchesSearch && f.esmrFacilityId !== null;
    }
    if (showUnlinkedOnly) {
      return matchesSearch && f.esmrFacilityId === null;
    }
    return matchesSearch;
  });

  const filteredEsmrFacilities = esmrFacilities.filter((f) =>
    f.facilityName.toLowerCase().includes(esmrSearchTerm.toLowerCase())
  );

  const linkedCount = facilities.filter(f => f.esmrFacilityId !== null).length;
  const unlinkedCount = facilities.filter(f => f.esmrFacilityId === null).length;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <h1 className="text-3xl font-bold mt-4">Facility Linking Administration</h1>
        <p className="text-muted-foreground mt-2">
          Link existing Facility records to eSMR monitoring data
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{facilities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Linked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{linkedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unlinked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{unlinkedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facilities List */}
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
            <CardDescription>Select a facility to link to eSMR data</CardDescription>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={showUnlinkedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowUnlinkedOnly(!showUnlinkedOnly);
                  setShowLinkedOnly(false);
                }}
              >
                Unlinked ({unlinkedCount})
              </Button>
              <Button
                variant={showLinkedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowLinkedOnly(!showLinkedOnly);
                  setShowUnlinkedOnly(false);
                }}
              >
                Linked ({linkedCount})
              </Button>
              {(showLinkedOnly || showUnlinkedOnly) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLinkedOnly(false);
                    setShowUnlinkedOnly(false);
                  }}
                >
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacilities.map((facility) => (
                    <TableRow
                      key={facility.id}
                      className={selectedFacility?.id === facility.id ? 'bg-muted' : ''}
                    >
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell className="text-sm font-mono">{facility.permitId}</TableCell>
                      <TableCell>
                        {facility.esmrFacilityId ? (
                          <Badge variant="default" className="bg-green-600">Linked</Badge>
                        ) : (
                          <Badge variant="outline">Unlinked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {facility.esmrFacilityId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unlinkFacility(facility.id)}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Unlink
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFacility(facility)}
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* eSMR Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>eSMR Facilities</CardTitle>
            <CardDescription>
              {selectedFacility
                ? `Select an eSMR facility to link with "${selectedFacility.name}"`
                : 'Select a facility on the left to begin linking'}
            </CardDescription>
            {selectedFacility && (
              <div className="relative mt-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search eSMR facilities..."
                  value={esmrSearchTerm}
                  onChange={(e) => setEsmrSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedFacility ? (
              <>
                <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Linking:</p>
                  <p className="text-lg font-semibold">{selectedFacility.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFacility.permitId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFacility(null);
                      setEsmrSearchTerm('');
                    }}
                    className="mt-2"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEsmrFacilities.slice(0, 50).map((esmrFacility) => (
                        <TableRow key={esmrFacility.facilityPlaceId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{esmrFacility.facilityName}</p>
                              {esmrFacility.receivingWaterBody && (
                                <p className="text-xs text-muted-foreground">
                                  {esmrFacility.receivingWaterBody}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{esmrFacility.regionCode}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                linkFacilities(selectedFacility.id, esmrFacility.facilityPlaceId)
                              }
                            >
                              <LinkIcon className="h-4 w-4 mr-1" />
                              Link
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredEsmrFacilities.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing first 50 results. Use search to narrow down.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a facility to begin linking</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Facilities Preview */}
      {linkedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Linked Facilities</CardTitle>
            <CardDescription>View and manage linked facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility</TableHead>
                  <TableHead>Permit ID</TableHead>
                  <TableHead>eSMR Facility</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities
                  .filter(f => f.esmrFacilityId !== null)
                  .slice(0, 10)
                  .map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell className="font-mono text-sm">{facility.permitId}</TableCell>
                      <TableCell>{facility.esmrFacility?.facilityName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{facility.esmrFacility?.regionCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/facilities/${facility.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unlinkFacility(facility.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
