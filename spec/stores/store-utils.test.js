var expect = require('chai').expect,
    utils = require('../../modules/stores/store-utils'),
    _ = require('lodash');


describe('Store utils library', function () {
    this.timeout(100);

    describe('applyTodaysOpeningHours', function () {
        var oldStoreDataFromDecember3 = require('./fixtures/store-with-special-openings_2014-12-03.json'),
            clonedStore,
            arrayToModify, today;

        beforeEach(function () {
            clonedStore = _.merge({}, oldStoreDataFromDecember3);
            arrayToModify = [clonedStore];
        });

        function testOpeningHours(expectedOpeningHours) {
            var todaysModifiedOpeningHours = clonedStore.store.openinghours.today;

            expect(arrayToModify).to.not.eql([oldStoreDataFromDecember3]);
            expect(todaysModifiedOpeningHours.from).to.equal(expectedOpeningHours.from);
            expect(todaysModifiedOpeningHours.to).to.equal(expectedOpeningHours.to);
        }

        it('should use "special" matching today\'s date, if we have old data', function () {
            // sunday, Dec 7
            today = new Date(2014, 12 - 1, 7, 10, 0, 0);

            utils.applyTodaysOpeningHours(today, arrayToModify);

            testOpeningHours(oldStoreDataFromDecember3.store.openinghours.special[0]);
        });

        it('should use the correct labelled day in "days" if special is not available, if we have old data', function () {
            // normal saturday, Dec 6
            today = new Date(2014, 12 - 1, 6, 10, 0, 0);

            utils.applyTodaysOpeningHours(today, arrayToModify);

            testOpeningHours(oldStoreDataFromDecember3.store.openinghours.days[1]);
        });

        it('should use the "hverdager" label for weekdays, if no special or labelled data, and we have old data', function () {
            // normal Monday, Dec 8
            today = new Date(2014, 12 - 1, 8, 10, 0, 0);

            utils.applyTodaysOpeningHours(today, arrayToModify);

            testOpeningHours(oldStoreDataFromDecember3.store.openinghours.days[0]);
        });

        it('should update the date on "today" when dealing with old data', function() {
            today = new Date(2014, 12 - 1, 8, 10, 0, 0);
            utils.applyTodaysOpeningHours(today, arrayToModify);
            expect(clonedStore.store.openinghours.today.date).to.equal('2014-12-08');
        });

    });
});

